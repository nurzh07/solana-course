import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getTokenMetadata,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  mintTo,
  transferChecked,
} from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";

const MINT = new PublicKey("DmpVG6t7XXsWqoMuq1TLTnaCvrfdtF4C5pw9iAowqMdP");

const loadKey = (p: string) =>
  Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(p.replace("~", os.homedir()), "utf8")))
  );
const txLink = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const payer = loadKey("~/.config/solana/id.json");
  const recipient = loadKey("~/recipient.json");

  console.log("Wallet:    ", payer.publicKey.toBase58());
  console.log("Recipient: ", recipient.publicKey.toBase58());

  // 1. Информация о mint
  const mint = await getMint(connection, MINT, "confirmed", TOKEN_2022_PROGRAM_ID);
  const dec = mint.decimals;
  console.log("\n--- Mint ---");
  console.log("Mint:      ", MINT.toBase58());
  console.log("Supply:    ", Number(mint.supply) / 10 ** dec);
  console.log("Decimals:  ", dec);
  console.log("Authority: ", mint.mintAuthority?.toBase58());

  // 2. On-chain metadata (Token Extensions)
  const meta = await getTokenMetadata(connection, MINT);
  console.log("\n--- Metadata ---");
  console.log("Name:      ", meta?.name);
  console.log("Symbol:    ", meta?.symbol);
  console.log("URI:       ", meta?.uri);

  // 3. Токен-аккаунты (ATA) отправителя и получателя
  const senderAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, MINT, payer.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID
  );
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection, payer, MINT, recipient.publicKey, false, "confirmed", undefined, TOKEN_2022_PROGRAM_ID
  );

  const bal = async (addr: PublicKey) =>
    Number((await getAccount(connection, addr, "confirmed", TOKEN_2022_PROGRAM_ID)).amount) / 10 ** dec;

  console.log("\n--- Balances BEFORE ---");
  console.log("Sender:    ", await bal(senderAta.address));
  console.log("Recipient: ", await bal(recipientAta.address));

  // 4. Выпуск ещё 500 токенов себе
  const mintSig = await mintTo(
    connection, payer, MINT, senderAta.address, payer,
    BigInt(500) * BigInt(10 ** dec), [], undefined, TOKEN_2022_PROGRAM_ID
  );
  console.log("\nMint 500 tx:     ", txLink(mintSig));

  // 5. Transfer 50 токенов получателю
  const trSig = await transferChecked(
    connection, payer, senderAta.address, MINT, recipientAta.address, payer,
    BigInt(50) * BigInt(10 ** dec), dec, [], undefined, TOKEN_2022_PROGRAM_ID
  );
  console.log("Transfer 50 tx:  ", txLink(trSig));

  console.log("\n--- Balances AFTER ---");
  console.log("Sender:    ", await bal(senderAta.address));
  console.log("Recipient: ", await bal(recipientAta.address));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
