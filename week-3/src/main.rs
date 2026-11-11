use borsh::{BorshDeserialize, BorshSerialize};
use clap::{Parser, Subcommand};
use std::{collections::BTreeMap, fmt, fs, path::Path};

const STATE_FILE: &str = "ledger.bin";

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
struct Account {
    owner: String,
    lamports: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
struct Ledger {
    accounts: BTreeMap<String, Account>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
enum Instruction {
    CreateAccount { name: String },
    Deposit { name: String, amount: u64 },
    Transfer { from: String, to: String, amount: u64 },
}

#[derive(Debug)]
enum LedgerError {
    AccountExists(String),
    AccountNotFound(String),
    InsufficientFunds { needed: u64, available: u64 },
    Overflow,
    Io(std::io::Error),
}

impl fmt::Display for LedgerError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            LedgerError::AccountExists(n) => write!(f, "аккаунт '{}' уже существует", n),
            LedgerError::AccountNotFound(n) => write!(f, "аккаунт '{}' не найден", n),
            LedgerError::InsufficientFunds { needed, available } => {
                write!(f, "недостаточно средств: нужно {}, доступно {}", needed, available)
            }
            LedgerError::Overflow => write!(f, "переполнение баланса"),
            LedgerError::Io(e) => write!(f, "ошибка ввода-вывода: {}", e),
        }
    }
}

impl std::error::Error for LedgerError {}

impl From<std::io::Error> for LedgerError {
    fn from(e: std::io::Error) -> Self {
        LedgerError::Io(e)
    }
}

impl Ledger {
    fn process(&mut self, ix: Instruction) -> Result<(), LedgerError> {
        match ix {
            Instruction::CreateAccount { name } => {
                if self.accounts.contains_key(&name) {
                    return Err(LedgerError::AccountExists(name));
                }
                self.accounts.insert(
                    name.clone(),
                    Account { owner: name, lamports: 0 },
                );
                Ok(())
            }
            Instruction::Deposit { name, amount } => {
                let acc = self
                    .accounts
                    .get_mut(&name)
                    .ok_or(LedgerError::AccountNotFound(name))?;
                acc.lamports = acc
                    .lamports
                    .checked_add(amount)
                    .ok_or(LedgerError::Overflow)?;
                Ok(())
            }
            Instruction::Transfer { from, to, amount } => {
                let from_balance = self
                    .accounts
                    .get(&from)
                    .ok_or_else(|| LedgerError::AccountNotFound(from.clone()))?
                    .lamports;
                let to_balance = self
                    .accounts
                    .get(&to)
                    .ok_or_else(|| LedgerError::AccountNotFound(to.clone()))?
                    .lamports;

                if from_balance < amount {
                    return Err(LedgerError::InsufficientFunds {
                        needed: amount,
                        available: from_balance,
                    });
                }
                let new_to = to_balance.checked_add(amount).ok_or(LedgerError::Overflow)?;

                if let Some(a) = self.accounts.get_mut(&from) {
                    a.lamports = from_balance - amount;
                }
                if let Some(a) = self.accounts.get_mut(&to) {
                    a.lamports = new_to;
                }
                Ok(())
            }
        }
    }
}

fn load() -> Result<Ledger, LedgerError> {
    if !Path::new(STATE_FILE).exists() {
        return Ok(Ledger::default());
    }
    let bytes = fs::read(STATE_FILE)?;
    Ok(borsh::from_slice::<Ledger>(&bytes)?)
}

fn save(ledger: &Ledger) -> Result<(), LedgerError> {
    let bytes = borsh::to_vec(ledger)?;
    fs::write(STATE_FILE, bytes)?;
    Ok(())
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

#[derive(Parser)]
#[command(name = "mini_ledger", about = "Мини-реестр аккаунтов в стиле Solana")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Создать аккаунт
    Create { name: String },
    /// Пополнить аккаунт (в lamports)
    Deposit { name: String, amount: u64 },
    /// Перевести lamports между аккаунтами
    Transfer { from: String, to: String, amount: u64 },
    /// Показать все аккаунты
    Show,
}

fn run() -> Result<(), LedgerError> {
    let cli = Cli::parse();
    let mut ledger = load()?;

    let ix = match cli.command {
        Command::Show => {
            if ledger.accounts.is_empty() {
                println!("Аккаунтов пока нет.");
            }
            for (name, acc) in &ledger.accounts {
                println!("{} | owner: {} | {} lamports", name, acc.owner, acc.lamports);
            }
            return Ok(());
        }
        Command::Create { name } => Instruction::CreateAccount { name },
        Command::Deposit { name, amount } => Instruction::Deposit { name, amount },
        Command::Transfer { from, to, amount } => Instruction::Transfer { from, to, amount },
    };

    let ix_bytes = borsh::to_vec(&ix)?;
    println!("Instruction: {:?}", ix);
    println!("Borsh bytes: {}", to_hex(&ix_bytes));

    ledger.process(ix)?;
    save(&ledger)?;
    println!("Готово.");
    Ok(())
}

fn main() {
    if let Err(e) = run() {
        eprintln!("Ошибка: {}", e);
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn transfer_works() {
        let mut l = Ledger::default();
        l.process(Instruction::CreateAccount { name: "alice".into() }).unwrap();
        l.process(Instruction::CreateAccount { name: "bob".into() }).unwrap();
        l.process(Instruction::Deposit { name: "alice".into(), amount: 100 }).unwrap();
        l.process(Instruction::Transfer {
            from: "alice".into(),
            to: "bob".into(),
            amount: 40,
        })
        .unwrap();
        assert_eq!(l.accounts["alice"].lamports, 60);
        assert_eq!(l.accounts["bob"].lamports, 40);
    }

    #[test]
    fn transfer_fails_without_funds() {
        let mut l = Ledger::default();
        l.process(Instruction::CreateAccount { name: "a".into() }).unwrap();
        l.process(Instruction::CreateAccount { name: "b".into() }).unwrap();
        let r = l.process(Instruction::Transfer {
            from: "a".into(),
            to: "b".into(),
            amount: 1,
        });
        assert!(matches!(r, Err(LedgerError::InsufficientFunds { .. })));
    }
}