import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as fs from "fs";
import {
  swapInternal,
  getPdaExBitmapAccount,
  TickArrayBitmapExtensionLayout,
  TxVersion,
} from "@raydium-io/raydium-sdk-v2";
import { CLMM_PROGRAM, connection, initRaydium, show } from "./common";

async function main() {
  const info = JSON.parse(fs.readFileSync("pool.json", "utf8"));
  const AMOUNT = new BN(process.env.AMOUNT_IN ?? "100000000"); // 100 токенов (6 знаков)
  const raydium = await initRaydium();

  const origValues = Object.values;
  (Object as any).values = (o: any) => (o == null ? [] : origValues(o));
  let d: any;
  try { d = await raydium.clmm.getPoolInfoFromRpc(info.poolId); }
  finally { (Object as any).values = origValues; }
  const { poolInfo, poolKeys } = d;

  const poolIdPub = new PublicKey(info.poolId);
  const zeroForOne = true; // токен A (mintA пула) -> токен B
  const { rpcData, tickArrays, configInfo } = await raydium.clmm.getSwapPoolInfo(info.poolId, zeroForOne);

  const exBitmap = getPdaExBitmapAccount(CLMM_PROGRAM, poolIdPub).publicKey;
  const exInfo = await connection.getAccountInfo(exBitmap);
  console.log("Bitmap extension:", exBitmap.toBase58(), exInfo ? "существует" : "нет");

  const sim: any = swapInternal({
    programId: CLMM_PROGRAM,
    poolId: poolIdPub,
    poolInfo: rpcData,
    tickArrays,
    configInfo,
    tickarrayBitmapExtension: exInfo ? TickArrayBitmapExtensionLayout.decode(exInfo.data) : undefined,
    amountSpecified: AMOUNT,
    sqrtPriceLimitX64: new BN(0),
    zeroForOne,
    isBaseInput: true,
    blockTimestamp: Math.floor(Date.now() / 1000),
    includeExtraTickArrays: true,
  } as any);

  console.log("\n=== Расчёт обмена ===");
  console.log("Отдаём (base):          ", AMOUNT.toString());
  console.log("Получим (base):         ", sim.amountCalculated.toString());
  console.log("Цена пула сейчас:       ", poolInfo.price);
  console.log("Аккаунты для swap (remaining):");
  show(sim.accounts);

  // Собираем инструкцию SDK, но НЕ отправляем
  const minOut = sim.amountCalculated.mul(new BN(99)).div(new BN(100));
  const r: any = await raydium.clmm.swap({
    poolInfo,
    poolKeys,
    inputMint: poolInfo.mintA.address,
    amountIn: AMOUNT,
    amountOutMin: minOut,
    observationId: rpcData.observationId,
    ownerInfo: { useSOLBalance: false },
    remainingAccounts: sim.accounts,
    txVersion: TxVersion.LEGACY,
  } as any);

  const ixs: any[] = r.transaction?.instructions ?? r.builder?.allInstructions ?? [];
  console.log("\n=== Инструкции транзакции SDK:", ixs.length, "===");
  for (const ix of ixs) {
    const isClmm = ix.programId.equals(CLMM_PROGRAM);
    console.log("\nПрограмма:", ix.programId.toBase58(), isClmm ? "<-- CLMM Raydium" : "");
    if (isClmm) {
      const data = Buffer.from(ix.data);
      console.log("Данные (hex):", data.toString("hex"), "| длина", data.length);
      ix.keys.forEach((k: any, i: number) =>
        console.log(String(i).padStart(2), k.pubkey.toBase58(), k.isSigner ? "S" : "-", k.isWritable ? "W" : "-"));
    }
  }
  console.log("\nКлючи программ для справки:");
  console.log("observationId:", String(rpcData.observationId));
  console.log("ammConfig:    ", String(poolInfo.config.id));
  console.log("vault A / B:  ", poolInfo.vault?.A ?? poolKeys?.vault?.A, poolInfo.vault?.B ?? poolKeys?.vault?.B);
}
main().catch((e) => { console.error(e); process.exit(1); });
