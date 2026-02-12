using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;

namespace TMIVHashing
{
    /// <summary>
    /// Local Key Vault sử dụng DPAPI (Data Protection API) của Windows
    /// Mã hóa/giải mã key mà không cần cloud service
    /// </summary>
    public class KeyVaultLocal
    {
        /// <summary>
        /// Mã hóa key bằng DPAPI (CurrentUser scope)
        /// </summary>
        public static string EncryptKey(string plainKey, string aesKey32, string salt32)
        {
            if (string.IsNullOrEmpty(plainKey))
                throw new ArgumentException("Key cannot be empty", nameof(plainKey));

            try
            {
                byte[] dataToEncrypt = Encoding.UTF8.GetBytes(plainKey);
                byte[] entropy = Encoding.UTF8.GetBytes(salt32); // salt/entropy
                byte[] key = SHA256.HashData(Encoding.UTF8.GetBytes(aesKey32)); // 32 bytes
                byte[] iv = new byte[16];                 // IV 16 bytes

                using var aes = Aes.Create();
                aes.Key = key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;
                byte[] ct;
                using (var enc = aes.CreateEncryptor())
                    ct = enc.TransformFinalBlock(dataToEncrypt, 0, dataToEncrypt.Length);

                // pack: [iv][cipher]
                byte[] blob = new byte[iv.Length + ct.Length];
                Buffer.BlockCopy(iv, 0, blob, 0, iv.Length);
                Buffer.BlockCopy(ct, 0, blob, iv.Length, ct.Length);
                byte[] encryptedData = ProtectedData.Protect(blob, entropy, DataProtectionScope.CurrentUser);
                return Convert.ToBase64String(encryptedData);
            }
            catch (Exception ex)
            {
                throw new Exception("Encrypt Exception!", ex);
            }
        }

        /// <summary>
        /// Giải mã key từ DPAPI
        /// </summary>
        public static string DecryptKey(string cipherB64, string aesKey32, string salt32)
        {
            if (string.IsNullOrEmpty(cipherB64))
                throw new ArgumentException("Encrypted cannot be empty", nameof(cipherB64));

            try
            {
                byte[] key = SHA256.HashData(Encoding.UTF8.GetBytes(aesKey32));
                byte[] entropy = Encoding.UTF8.GetBytes(salt32);

                byte[] dp = Convert.FromBase64String(cipherB64);
                byte[] blob = ProtectedData.Unprotect(dp, entropy, DataProtectionScope.CurrentUser);

                // unpack
                byte[] iv = blob.Take(16).ToArray();
                byte[] ct = blob.Skip(16).ToArray();

                using var aes = Aes.Create();
                aes.Key = key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                byte[] decryptedData;
                using (var dec = aes.CreateDecryptor())
                    decryptedData = dec.TransformFinalBlock(ct, 0, ct.Length);

                return Encoding.UTF8.GetString(decryptedData);
            }
            catch (Exception ex)
            {
                throw new Exception("Decrypt Exception!", ex);
            }
        }


        public static string EncryptConnectionStringPassword(string passwordPlain, string envSecretVar = "APP_SECRET_KEY", string envSaltVar = "APP_SALT_KEY", int rounds = 5)
        {
            var secretPlain = Environment.GetEnvironmentVariable(envSecretVar, EnvironmentVariableTarget.Machine);
            var saltPlain = Environment.GetEnvironmentVariable(envSaltVar, EnvironmentVariableTarget.Machine);

            if (string.IsNullOrEmpty(secretPlain))
                throw new ArgumentException($"Environment variable {envSecretVar} is not set or empty.", envSecretVar);
            if (string.IsNullOrEmpty(saltPlain))
                throw new ArgumentException($"Environment variable {envSaltVar} is not set or empty.", envSaltVar);

            // Optional: allow keys of various lengths, but advise 32-char plain text
            if (secretPlain.Length < 24 || saltPlain.Length < 24)
                throw new ArgumentException("Secret and salt should be at least 8 characters; recommended 24.");

            var sList = new List<string>();
            var tList = new List<string>();

            string currentSecret = secretPlain;

            for (int i = 0; i < rounds; i++)
            {
                // Encrypt current secret with the plain salt => new secret cipher
                currentSecret = SaltKey.EncryptECB(currentSecret, saltPlain);
                sList.Add(currentSecret);

                // Encrypt the plain salt with the new secret cipher => salt cipher
                var saltCipher = SaltKey.EncryptECB(saltPlain, currentSecret);
                tList.Add(saltCipher);
            }

            // Use the transformed (final) secret and salt as key material.
            // This ensures the stored cipher cannot be decrypted using the original plain environment values.
            var finalSecret = sList.Last();
            var finalSalt = tList.Last();

            // Use DPAPI-backed EncryptKey to encrypt the connection password using the transformed keys
            return EncryptKey(passwordPlain, finalSecret, finalSalt);
        }


        public static string DecryptConnectionStringPassword(string passwordCipherB64, string envSecretVar = "APP_SECRET_KEY", string envSaltVar = "APP_SALT_KEY", int rounds = 5 )
        {
            var secretPlain = Environment.GetEnvironmentVariable(envSecretVar, EnvironmentVariableTarget.Machine);
            var saltPlain = Environment.GetEnvironmentVariable(envSaltVar, EnvironmentVariableTarget.Machine);

            if (string.IsNullOrEmpty(secretPlain))
                throw new ArgumentException($"Environment variable {envSecretVar} is not set or empty.", envSecretVar);
            if (string.IsNullOrEmpty(saltPlain))
                throw new ArgumentException($"Environment variable {envSaltVar} is not set or empty.", envSaltVar);

            // Optional: allow keys of various lengths, but advise 32-char plain text
            if (secretPlain.Length < 24 || saltPlain.Length < 24)
                throw new ArgumentException("Secret and salt should be at least 8 characters; recommended 24.");

            var sList = new List<string>();
            var tList = new List<string>();

            string currentSecret = secretPlain;

            for (int i = 0; i < rounds; i++)
            {
                // Encrypt current secret with the plain salt => new secret cipher
                currentSecret = SaltKey.EncryptECB(currentSecret, saltPlain);
                sList.Add(currentSecret);

                // Encrypt the plain salt with the new secret cipher => salt cipher
                var saltCipher = SaltKey.EncryptECB(saltPlain, currentSecret);
                tList.Add(saltCipher);
            }

            // Use the transformed (final) secret and salt as key material for decryption
            var finalSecret = sList.Last();
            var finalSalt = tList.Last();

            // Use DPAPI-backed DecryptKey to decrypt the connection password using the transformed keys
            return DecryptKey(passwordCipherB64, finalSecret, finalSalt);
        }
    }
}

