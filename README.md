# Solana course: weeks 3-7

All programs are deployed to **Solana Devnet**.

| Week | Topic | Folder | On-chain (Devnet) |
|------|-------|--------|-------------------|
| 3 | Rust CLI for Solana developers (mini_ledger) | `week3_mini_ledger` | local CLI, `cargo test` |
| 4 | First Solana Program (hello_solana) | `week4_hello_solana` | [qMqXi47j...V3t](https://explorer.solana.com/address/qMqXi47jeJ4sCwdHfeezjQW7K74srMNPGMKA6iCmV3t?cluster=devnet) |
| 5 | Anchor: Counter Program + TypeScript client | `week5_counter_app` | [6PSMr18J...DPi](https://explorer.solana.com/address/6PSMr18JqJcSwocXbPfsXKHTZe2zd21V9D2nwEeJmDpi?cluster=devnet) |
| 6 | Accounts, PDAs: on-chain profile | `week6_profile_app` | [54LZGfcs...ZSN](https://explorer.solana.com/address/54LZGfcs44iUpEojGMcYcaV71SZhj11vssLqpuKfjZSN?cluster=devnet), profile PDA [AuzGQtKn...xeo](https://explorer.solana.com/address/AuzGQtKnnWJaBjpLC3aS24s3jGhCAVUeRuboqTVvTxeo?cluster=devnet) |
| 7 | SPL Token / Token Extensions (Token-2022) + client | `week7_token_client` | mint [DmpVG6t7...MdP](https://explorer.solana.com/address/DmpVG6t7XXsWqoMuq1TLTnaCvrfdtF4C5pw9iAowqMdP?cluster=devnet) |

Stack: Rust, Anchor 1.1.2, Solana CLI 3.1.10, TypeScript.

Main source files:
- week3: `src/main.rs`
- week4: `src/lib.rs`
- week5: `programs/counter_app/src/lib.rs`, `tests/counter_app.ts`
- week6: `programs/profile_app/src/lib.rs`, `tests/profile_app.ts`
- week7: `client.ts` (the token itself was created with `spl-token` CLI)

## Проект «Liquidity Vault» (недели 8-12)

| Неделя | Тема | Папка |
|--------|------|-------|
| 8 | Каркас vault (РК1) | `week-8` |
| 9 | Депозит и share-токены | `week-9` |
| 10 | Вывод, CPI Burn + TransferChecked | `week-10` |
| 11 | Свои токены и CLMM-пул Raydium (devnet) | `week-11` |
| 12 | Swap через Raydium (CPI) | `week-12/vault` (программа), `week-12/client` (скрипты) |

Программа vault (devnet): `C9pH3cWmgQihD2xPQgWxsb7QyWkNpXQNPxsCBkVJrQM1`. Пул Raydium CLMM: `97pm3KyTiewPK1e9ho64madehSy6Xz7rqHAj2PKPZwr4`. Подробности и ссылки на транзакции: `week-12/vault/README.md`.

## Week 13 — Raydium CLMM Liquidity Management

- Open CLMM position via CPI
- Collect trading fees
- Close liquidity position
- Independent trader swaps
- Automatic range monitoring
- Position rebalancing
- Admin authorization tests
- Deposit and withdrawal protection
- Successful real withdrawal on Devnet

Status: Completed

[Week 13 source code and documentation](./week-13/)
