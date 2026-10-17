use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    msg!("Program ID: {}", program_id);
    msg!("Accounts passed: {}", accounts.len());
    msg!("Instruction data length: {}", instruction_data.len());
    Ok(())
}
