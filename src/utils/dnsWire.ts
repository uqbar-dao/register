function charToUTF8Bytes(character: any) {
    const codePoint = character.codePointAt(0);

    if (codePoint <= 0x7F) {
        return [codePoint];
    } else if (codePoint <= 0x7FF) {
        return [
            0xC0 | ((codePoint >> 6) & 0x1F),
            0x80 | (codePoint & 0x3F)
        ];
    } else if (codePoint <= 0xFFFF) {
        return [
            0xE0 | ((codePoint >> 12) & 0x0F),
            0x80 | ((codePoint >> 6) & 0x3F),
            0x80 | (codePoint & 0x3F)
        ];
    } else if (codePoint <= 0x10FFFF) {
        return [
            0xF0 | ((codePoint >> 18) & 0x07),
            0x80 | ((codePoint >> 12) & 0x3F),
            0x80 | ((codePoint >> 6) & 0x3F),
            0x80 | (codePoint & 0x3F)
        ];
    } else {
        throw new Error('Invalid Unicode code point');
    }
}

export function toDNSWireFormat(domain: string) {
    const labels = domain.split('.');
    
    // Calculate the total byte length needed for the buffer
    const totalByteLength = labels.reduce((acc, label) => {
        // Calculate the byte length needed for the label
        // console.log(label)
        const labelBytes = Array.from(label).reduce((labelAcc, char) => {
            const utf8Bytes = charToUTF8Bytes(char);
            // console.log(utf8Bytes.length, char, utf8Bytes)
            return labelAcc + utf8Bytes.length;
        }, 0);
        
        // Include the length byte for the label
        return acc + 1 + labelBytes;
    }, 0); // starts at 1 for empty byte at the end
    // console.log("TOTAL", totalByteLength)
    // const totalByteLength = 15

    const buffer = new ArrayBuffer(totalByteLength + 1); // Create a binary buffer
    const view = new DataView(buffer); // Create a DataView to write binary data

    let offset = 0; // Track the current offset in the buffer

    for (const label of labels) {
        const len = label.length;
        // TODO if len > 255 throw error

        // Write the length byte
        view.setUint8(offset, len);
        offset++; // Increment offset for the length byte

        // Write label data as UTF-8
        for (let j = 0; j < len; j++) {
            const utf8Bytes = charToUTF8Bytes(label[j]); // Convert character to UTF-8 bytes
            for (const byte of utf8Bytes) {
                view.setUint8(offset, byte);
                offset++; // Increment offset by the number of bytes written
            }
        }
    }

    // Convert the binary buffer to a hex string
    const hexArray = Array.from(new Uint8Array(buffer));
    const hexString = hexArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return `0x${hexString}`;
}
