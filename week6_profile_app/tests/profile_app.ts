import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { ProfileApp } from "../target/types/profile_app";

const explorer = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

describe("profile_app client (Devnet)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.profileApp as Program<ProfileApp>;
  const wallet = provider.wallet.publicKey;

  // PDA профиля: seeds = ["profile", wallet]
  const [profilePda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), wallet.toBuffer()],
    program.programId
  );

  it("Creates, updates and protects the profile PDA", async () => {
    console.log("Program ID:  ", program.programId.toBase58());
    console.log("Wallet:      ", wallet.toBase58());
    console.log("Profile PDA: ", profilePda.toBase58(), "(bump " + bump + ")");

    // 1. create_profile
    const createSig = await program.methods
      .createProfile("nurka", "Solana developer, week 6")
      .accountsPartial({ profile: profilePda, authority: wallet })
      .rpc();
    console.log("Create tx:", explorer(createSig));

    let p = await program.account.profile.fetch(profilePda);
    console.log("Username:", p.username);
    console.log("Bio:     ", p.bio);
    console.log("Bump:    ", p.bump);
    if (p.username !== "nurka") throw new Error("Wrong username");

    // 2. update_profile
    const updateSig = await program.methods
      .updateProfile("Updated bio: learning PDAs on Solana")
      .accountsPartial({ profile: profilePda, authority: wallet })
      .rpc();
    console.log("Update tx:", explorer(updateSig));

    p = await program.account.profile.fetch(profilePda);
    console.log("New bio: ", p.bio);
    if (!p.bio.startsWith("Updated")) throw new Error("Bio not updated");

    // 3. чужой кошелёк не может изменить профиль
    const attacker = anchor.web3.Keypair.generate();
    let rejected = false;
    try {
      await program.methods
        .updateProfile("hacked")
        .accountsPartial({ profile: profilePda, authority: attacker.publicKey })
        .signers([attacker])
        .rpc();
    } catch (e) {
      rejected = true;
      console.log("Attacker rejected as expected");
    }
    if (!rejected) throw new Error("Attacker was NOT rejected");
  });
});
