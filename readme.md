A simple example of a Solana account getting created with an arbitrary owner.

Here we create a PDA account using the system program's `create_account_with_seed` function which allows the owner to not be a signer of the transaction.


```bash
anchor test
```