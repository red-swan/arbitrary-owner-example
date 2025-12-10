use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("EapZcap2czdFtDnP9Wds3DmxRtS2bWQsBCGrLhADZk73");

#[program]
pub mod anchor_playground {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_account_with_owner(
        ctx: Context<CreateAccountWithOwner>,
        seed: String,
        owner: Pubkey,
        space: u64,
        lamports: u64,
    ) -> Result<()> {
        msg!("Creating account with owner: {:?}", owner);
        msg!("Using base: {:?}, seed: {}", ctx.accounts.base.key(), seed);
        msg!("Space: {} bytes, Lamports: {}", space, lamports);

        // Create the instruction for CreateAccountWithSeed
        // This only requires the base account to sign, not the new account
        let create_account_ix = system_instruction::create_account_with_seed(
            &ctx.accounts.payer.key(),      // Funding account
            &ctx.accounts.new_account.key(), // Address of the account to create
            &ctx.accounts.base.key(),        // Base account for derivation
            &seed,                           // Seed string
            lamports,                        // Lamports to transfer
            space,                           // Space to allocate
            &owner,                          // Owner program ID (can be arbitrary!)
        );

        // Invoke the system program
        anchor_lang::solana_program::program::invoke(
            &create_account_ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.new_account.to_account_info(),
                ctx.accounts.base.to_account_info(),
            ],
        )?;

        msg!("Account created successfully at: {:?}", ctx.accounts.new_account.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct CreateAccountWithOwner<'info> {
    /// Account that pays for the new account
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The new account to be created (derived from base + seed)
    /// CHECK: Address is derived and validated by the system program
    #[account(mut)]
    pub new_account: UncheckedAccount<'info>,

    /// Base account used for address derivation - must sign
    pub base: Signer<'info>,

    pub system_program: Program<'info, System>,
}
