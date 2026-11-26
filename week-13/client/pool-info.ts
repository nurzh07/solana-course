import * as fs from "fs";
import { initRaydium } from "./common";

const rep = (_k: string, v: any) =>
  v && v.constructor && v.constructor.name === "PublicKey" ? v.toBase58()
  : v && v.constructor && v.constructor.name === "BN" ? v.toString() : v;

async function main() {
  const info = JSON.parse(fs.readFileSync("pool.json", "utf8"));
  const raydium = await initRaydium();
  const origValues = Object.values;
  (Object as any).values = (o: any) => (o == null ? [] : origValues(o));
  let d: any;
  try { d = await raydium.clmm.getPoolInfoFromRpc(info.poolId); }
  finally { (Object as any).values = origValues; }

  const out = {
    poolId: info.poolId,
    programId: d.poolInfo.programId,
    price: d.poolInfo.price,
    mintA: d.poolInfo.mintA.address,
    mintB: d.poolInfo.mintB.address,
    tickSpacing: d.poolInfo.config?.tickSpacing,
    ammConfig: d.poolInfo.config?.id,
    tradeFeeRate: d.poolInfo.config?.tradeFeeRate,
    vaultA: d.poolKeys?.vault?.A ?? d.rpcPoolInfo?.vaultA,
    vaultB: d.poolKeys?.vault?.B ?? d.rpcPoolInfo?.vaultB,
    observationId: d.rpcPoolInfo?.observationId,
    tickCurrent: d.rpcPoolInfo?.tickCurrent,
    liquidity: d.rpcPoolInfo?.liquidity,
    position: info,
    poolKeys: d.poolKeys,
  };
  fs.writeFileSync("pool-accounts.json", JSON.stringify(out, rep, 2));
  console.log(JSON.stringify({ ...out, poolKeys: "(см. pool-accounts.json)" }, rep, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
