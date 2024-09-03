use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("Max entrants is too large")]
    MaxEntrantsTooLarge,
    #[msg("Raffle has ended")]
    RaffleEnded,
    #[msg("Your Token is not REAP Token")]
    NotREAPToken,
    #[msg("Raffle has not ended")]
    RaffleNotEnded,
    #[msg("Invalid prize index")]
    InvalidPrizeIndex,
    #[msg("Invalid new End time")]
    EndTimeError,
    #[msg("No prize")]
    NoPrize,
    #[msg("You are not the Creator")]
    NotCreator,
    #[msg("You are not the Winnner")]
    NotWinner,
    #[msg("There are other Entrants")]
    OtherEntrants,
    #[msg("Invalid calculation")]
    InvalidCalculation,
    #[msg("You don't have enough token")]
    NotEnoughToken,
    #[msg("You don't have enough SOL")]
    NotEnoughSOL,
    #[msg("Not enough tickets left")]
    NotEnoughTicketsLeft,
    #[msg("Raffle is still running")]
    RaffleStillRunning,
    #[msg("Winner already drawn")]
    WinnersAlreadyDrawn,
    #[msg("Winner not drawn")]
    WinnerNotDrawn,
    #[msg("Invalid revealed data")]
    InvalidRevealedData,
    #[msg("Ticket account not owned by winner")]
    TokenAccountNotOwnedByWinner,
    #[msg("Ticket has not won")]
    TicketHasNotWon,
    #[msg("Unclaimed prizes")]
    UnclaimedPrizes,
    #[msg("Invalid recent blockhashes")]
    InvalidRecentBlockhashes,
}
