const crypto = require('crypto');


function encrypt_object(object, key) {
    const plainText = JSON.stringify(object);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(process.env.REACT_APP_ENCRYPTION_ALGORITHM, Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        encryptedData: encrypted
    };
}


function decrypt_object(encrypted_object, key) {
    const decipher = crypto.createDecipheriv(
        process.env.REACT_APP_ENCRYPTION_ALGORITHM,
        Buffer.from(key, 'hex'),
        Buffer.from(encrypted_object.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encrypted_object.authTag, 'hex'));
    let decrypted = decipher.update(encrypted_object.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
};

module.exports = {encrypt_object, decrypt_object}