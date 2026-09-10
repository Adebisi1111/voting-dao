# Register your wallet from CLI
# Replace YOUR_PRIVATE_KEY with your wallet's private key

cd /home/administrator/voting-dao

# Method 1: Using private key directly
echo "test1234" | genlayer write 0x1c879aF42b31f5aA739fb6957e168E29C9a15AcE register_voter

# Method 2: If you have a keystore for 0x61fd...3de3
# Import the keystore first, then run the same command
