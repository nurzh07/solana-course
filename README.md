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
