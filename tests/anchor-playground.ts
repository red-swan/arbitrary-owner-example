import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorPlayground } from "../target/types/anchor_playground";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("anchor-playground", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorPlayground as Program<AnchorPlayground>;
  const provider = anchor.AnchorProvider.env();

  it("Can create arbitrary accounts? initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Creates an account with arbitrary owner using CreateAccountWithSeed", async () => {
    // The base account for derivation - this must sign (but NOT the new account!)
    // We can use the payer as the base, or create a new keypair
    const baseAccount = Keypair.generate();

    // Define a seed string for deriving the account address
    const seed = "my-seed-string";

    // Define an arbitrary owner (can be ANY program ID)
    // For this example, we'll use the Token Program as the arbitrary owner
    const TOKEN_PROGRAM_ID = new anchor.web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const arbitraryOwner = TOKEN_PROGRAM_ID;

    // Alternative examples of arbitrary owners:
    // const arbitraryOwner = SystemProgram.programId;
    // const arbitraryOwner = Keypair.generate().publicKey; // Any random pubkey

    // Derive the new account address from base + seed + owner
    // IMPORTANT: The new account address is deterministic based on these inputs
    const newAccountAddress = await anchor.web3.PublicKey.createWithSeed(
      baseAccount.publicKey,  // base
      seed,                   // seed
      arbitraryOwner          // owner (used in derivation)
    );

    // Define the space (in bytes) for the new account
    const space = 100; // 100 bytes

    // Calculate minimum lamports needed for rent exemption
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(space);

    console.log("Creating account with CreateAccountWithSeed:");
    console.log("  Base Account:", baseAccount.publicKey.toString());
    console.log("  Seed:", seed);
    console.log("  Derived Account Address:", newAccountAddress.toString());
    console.log("  Owner (ARBITRARY):", arbitraryOwner.toString());
    console.log("  Space:", space, "bytes");
    console.log("  Lamports:", lamports);

    // Call the program to create the account
    // Notice: We only sign with baseAccount, NOT with newAccountAddress!
    const tx = await program.methods
      .createAccountWithOwner(
        seed,
        arbitraryOwner,
        new anchor.BN(space),
        new anchor.BN(lamports)
      )
      .accounts({
        payer: provider.wallet.publicKey,
        newAccount: newAccountAddress,
        base: baseAccount.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([baseAccount]) // Only base account signs, NOT the new account!
      .rpc();

    console.log("\nTransaction signature:", tx);

    // Verify the account was created with the correct owner
    const accountInfo = await provider.connection.getAccountInfo(newAccountAddress);
    console.log("\nAccount created successfully!");
    console.log("  Address:", newAccountAddress.toString());
    console.log("  Owner:", accountInfo.owner.toString());
    console.log("  Lamports:", accountInfo.lamports);
    console.log("  Data length:", accountInfo.data.length);

    // Assert the owner is correct - THIS IS THE KEY POINT!
    // We successfully created an account owned by an arbitrary program
    if (accountInfo.owner.toString() !== arbitraryOwner.toString()) {
      throw new Error("Account owner mismatch!");
    }

    console.log("\n✅ SUCCESS: Created account with arbitrary owner without that owner signing!");
  });
});
