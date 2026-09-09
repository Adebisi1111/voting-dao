import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, padding
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
import binascii

# Load keystore
with open('/home/administrator/.genlayer/keystores/agent.json', 'r') as f:
    keystore = json.load(f)

password = b'test1234'
salt = binascii.unhexlify(keystore['Crypto']['kdfparams']['salt'])
n = keystore['Crypto']['kdfparams']['n']
r = keystore['Crypto']['kdfparams']['r']
p = keystore['Crypto']['kdfparams']['p']
dklen = keystore['Crypto']['kdfparams']['dklen']

# Derive key using Scrypt
kdf = Scrypt(salt=salt, length=dklen, n=n, r=r, p=p)
key = kdf.derive(password)

# Decrypt
iv = binascii.unhexlify(keystore['Crypto']['cipherparams']['iv'])
ciphertext = binascii.unhexlify(keystore['Crypto']['ciphertext'])

cipher = Cipher(algorithms.AES(key[:16]), modes.CTR(iv))
decryptor = cipher.decryptor()
private_key = decryptor.update(ciphertext) + decryptor.finalize()

print(f"0x{private_key.hex()}")
