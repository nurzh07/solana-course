import Decimal from "decimal.js";
import BN from "bn.js";
import * as fs from "fs";
import { PoolUtils, TickUtil } from "@raydium-io/raydium-sdk-v2";
import { CLMM_PROGRAM, initRaydium, txVersion, explorerTx, explorerAddr, show } from "./common";

async function main() {
  const info = JSON.parse(fs.readFileSync("pool.json", "utf8"));
  const RANGE = new Decimal(process.env.RANGE ?? "0.05");     // ±5%
  const AMOUNT = new Decimal(process.env.AMOUNT ?? "10000");  // токенов mintA

  const raydium = await initRaydium();
  // В этой версии SDK getPoolInfoFromRpc падает для пула без ликвидности:
  // у нового пула ещё нет tick-массивов, и Object.values(undefined) бросает ошибку.
  // На время вызова подменяем Object.values безопасной версией.
  const origValues = Object.values;
  (Object as any).values = (o: any) => (o == null ? [] : origValues(o));
  let poolData: any;
  try {
    poolData = await raydium.clmm.getPoolInfoFromRpc(info.poolId);
  } finally {
    (Object as any).values = origValues;
  }
  const { poolInfo, poolKeys } = poolData;

  console.log("Pool:       ", info.poolId);
  console.log("mintA:      ", poolInfo.mintA.address, "decimals", poolInfo.mintA.decimals);
  console.log("mintB:      ", poolInfo.mintB.address, "decimals", poolInfo.mintB.decimals);
  console.log("Цена пула:  ", poolInfo.price, "(mintB за 1 mintA)");
  console.log("Шаг тика:   ", poolInfo.config.tickSpacing);

  const currentPrice = new Decimal(poolInfo.price);
  const lowerWanted = currentPrice.mul(new Decimal(1).minus(RANGE));
  const upperWanted = currentPrice.mul(new Decimal(1).plus(RANGE));

  const snap = (price: Decimal) =>
    TickUtil.getPriceAndTick({
      price,
      mintADecimals: poolInfo.mintA.decimals,
      mintBDecimals: poolInfo.mintB.decimals,
      zeroForOne: true,
      tickSpacing: poolInfo.config.tickSpacing,
    } as any);
  const lower = snap(lowerWanted);
  const upper = snap(upperWanted);
  const tickLower = (lower as any).tick;
  const tickUpper = (upper as any).tick;
  console.log("Диапазон:   ", String((lower as any).price), "-", String((upper as any).price),
              "| тики", tickLower, "..", tickUpper);

  const baseAmount = new BN(AMOUNT.mul(new Decimal(10).pow(poolInfo.mintA.decimals)).toFixed(0));
  const res: any = await PoolUtils.getLiquidityAmountOutFromAmountIn({
    poolInfo,
    slippage: 0.01,
    inputA: true,
    tickUpper,
    tickLower,
    amount: baseAmount,
    add: true,
    amountHasFee: true,
    epochInfo: await raydium.fetchEpochInfo(),
  } as any);
  console.log("Нужно mintA:", res.amountA.amount.toString());
  console.log("Нужно mintB:", res.amountB.amount.toString(), "(максимум с запасом на slippage:", res.amountSlippageB.amount.toString() + ")");
  console.log("Ликвидность:", res.liquidity.toString());
  // В этой версии SDK amountSlippageB оказался МЕНЬШЕ нужной суммы (запас считался в обратную
  // сторону), и Raydium отклонял транзакцию (PriceSlippageCheck, код 6017).
  // Считаем максимум сами: нужная сумма + 3%.
  const otherAmountMax = new BN(res.amountB.amount.toString()).mul(new BN(103)).div(new BN(100));
  console.log("Максимум mintB, который готовы отдать:", otherAmountMax.toString());

  const { execute, extInfo } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    poolKeys,
    tickUpper,
    tickLower,
    base: "MintA",
    ownerInfo: { useSOLBalance: true },
    baseAmount,
    otherAmountMax,
    txVersion,
  } as any);
  const { txId } = await execute({ sendAndConfirm: true });
  console.log("\n=== Позиция открыта ===");
  console.log("Tx:", explorerTx(txId));
  console.log("extInfo:");
  show(extInfo);

  // Находим позицию среди позиций кошелька
  await new Promise((r) => setTimeout(r, 5000));
  const positions: any[] = await raydium.clmm.getOwnerPositionInfo({ programId: CLMM_PROGRAM });
  const mine = positions.filter((p) => p.poolId.toBase58() === info.poolId);
  for (const p of mine) {
    console.log("\nПозиция: NFT mint", p.nftMint.toBase58(), "| тики", p.tickLower, "..", p.tickUpper,
                "| ликвидность", p.liquidity.toString());
    console.log("Explorer NFT:", explorerAddr(p.nftMint.toBase58()));
  }
  fs.writeFileSync("pool.json", JSON.stringify({
    ...info, tickLower, tickUpper,
    rangeFrom: String((lower as any).price), rangeTo: String((upper as any).price),
    nftMint: mine[0] ? mine[0].nftMint.toBase58() : null,
  }, null, 2));
  console.log("\nДанные позиции добавлены в pool.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
