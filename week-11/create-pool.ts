import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import * as fs from "fs";
import { CLMM_PROGRAM, initRaydium, tokenInfo, txVersion, explorerTx, explorerAddr, owner } from "./common";

async function main() {
  const MINT_A = process.env.MINT_A!;
  const MINT_B = process.env.MINT_B!;
  const PRICE = new Decimal(process.env.PRICE ?? "1");   // цена: сколько B за 1 A

  const raydium = await initRaydium();
  console.log("Wallet:", owner.publicKey.toBase58());

  // Конфигурации комиссий CLMM из devnet API
  const configs = await raydium.api.getClmmConfigs();
  console.log("Доступные конфигурации (index, комиссия, шаг тика):");
  for (const c of configs) console.log(" ", c.index, c.tradeFeeRate, c.tickSpacing, c.id);
  const picked = configs.find((c: any) => c.index === 1) ?? configs[0];
  console.log("Выбрана конфигурация:", picked.index, "комиссия", picked.tradeFeeRate, "шаг тика", picked.tickSpacing);
  const ammConfig = { ...picked, id: new PublicKey(picked.id), fundOwner: "", description: "" };

  const { execute, extInfo } = await raydium.clmm.createPool({
    programId: CLMM_PROGRAM,
    mint1: tokenInfo(MINT_A),
    mint2: tokenInfo(MINT_B),
    ammConfig,
    initialPrice: PRICE,
    txVersion,
  });

  const { txId } = await execute({ sendAndConfirm: true });
  const poolId = String(extInfo.address.id);
  console.log("\n=== Пул создан ===");
  console.log("Pool ID:   ", poolId);
  console.log("Tx:        ", explorerTx(txId));
  console.log("Explorer:  ", explorerAddr(poolId));
  fs.writeFileSync("pool.json", JSON.stringify({ poolId, mintA: MINT_A, mintB: MINT_B, price: PRICE.toString() }, null, 2));
  console.log("Pool ID сохранён в pool.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
