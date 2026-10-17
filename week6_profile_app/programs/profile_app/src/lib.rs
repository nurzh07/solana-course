use anchor_lang::prelude::*;

declare_id!("54LZGfcs44iUpEojGMcYcaV71SZhj11vssLqpuKfjZSN");

#[program]
pub mod profile_app {
    use super::*;

    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
        bio: String,
    ) -> Result<()> {
        require!(username.len() <= 32, ProfileError::UsernameTooLong);
        require!(bio.len() <= 160, ProfileError::BioTooLong);

        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.username = username;
        profile.bio = bio;
        profile.created_at = now;
        profile.updated_at = now;
        profile.bump = ctx.bumps.profile;
        msg!("Profile created: {}", profile.username);
        Ok(())
    }

    pub fn update_profile(ctx: Context<UpdateProfile>, bio: String) -> Result<()> {
        require!(bio.len() <= 160, ProfileError::BioTooLong);

        let profile = &mut ctx.accounts.profile;
        profile.bio = bio;
        profile.updated_at = Clock::get()?.unix_timestamp;
        msg!("Profile updated: {}", profile.username);
        Ok(())
    }

    pub fn delete_profile(_ctx: Context<DeleteProfile>) -> Result<()> {
        msg!("Profile deleted");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Profile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, Profile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteProfile<'info> {
    #[account(
        mut,
        close = authority,
        has_one = authority,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, Profile>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub authority: Pubkey,
    #[max_len(32)]
    pub username: String,
    #[max_len(160)]
    pub bio: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum ProfileError {
    #[msg("Username is too long (max 32 bytes)")]
    UsernameTooLong,
    #[msg("Bio is too long (max 160 bytes)")]
    BioTooLong,
}
