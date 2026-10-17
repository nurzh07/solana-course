import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { CounterApp } from "../target/types/counter_app";

const explorer = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

describe("counter_app client (Devnet)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.counterApp as Program<CounterApp>;

  // Новый аккаунт для счётчика
  const counter = anchor.web3.Keypair.generate();

  it("Initializes, increments twice and reads the counter", async () => {
    console.log("Program ID:      ", program.programId.toBase58());
    console.log("Wallet:          ", provider.wallet.publicKey.toBase58());
    console.log("Counter account: ", counter.publicKey.toBase58());

    // 1. initialize
    const initSig = await program.methods
      .initialize()
      .accountsPartial({ counter: counter.publicKey })
      .signers([counter])
      .rpc();
    console.log("Initialize tx:", explorer(initSig));

    let data = await program.account.counter.fetch(counter.publicKey);
    console.log("Count after initialize:", data.count.toString());
    if (data.count.toNumber() !== 0) throw new Error("Expected 0");

    // 2. increment (1)
    const inc1 = await program.methods
      .increment()
      .accountsPartial({ counter: counter.publicKey })
      .rpc();
    console.log("Increment #1 tx:", explorer(inc1));

    // 3. increment (2)
    const inc2 = await program.methods
      .increment()
      .accountsPartial({ counter: counter.publicKey })
      .rpc();
    console.log("Increment #2 tx:", explorer(inc2));

    // 4. чтение результата
    data = await program.account.counter.fetch(counter.publicKey);
    console.log("Final count:", data.count.toString());
    console.log("Authority:  ", data.authority.toBase58());
    if (data.count.toNumber() !== 2) throw new Error("Expected 2");
  });
});
