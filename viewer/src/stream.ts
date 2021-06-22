export class BEReader {
    static readUint8(buffer: any, offset: number) {
        let byte = new Uint8Array(buffer, offset, 1);
        return byte[0];
    }

    // BigEndian
    static readUint16(buffer: any, offset: number) {
        let bytes = new Uint8Array(buffer, offset, 2);
        let r = (bytes[0] << 8) + bytes[1];
        return r;
    }

    // BigEndian
    static readUint32(buffer: any, offset: number) {
        let bytes = new Uint8Array(buffer, offset, 4);
        let r = (bytes[0] << 24) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
        return r;
    }

    static readInt16(buffer: any, offset: number) {
        let view = new DataView(buffer, offset);
        let be = view.getInt16(0, false);
        return be;
    }
}

export class StreamReader {
    offset: number;
    buffer: any;

    constructor (buffer: any, offset: number) {
        this.buffer = buffer;
        this.offset = offset;
    }

    uint8Buffer(length: number) {
        let r = new Uint8Array(this.buffer, this.offset, length);
        this.offset+=length;
        return r;
    }

    uint8() {
        let r = BEReader.readUint8(this.buffer, this.offset);
        this.offset++;
        return r;
    }

    int16() {
        let r = BEReader.readInt16(this.buffer, this.offset);
        this.offset+=2;
        return r;
    }

    uint16() {
        let r = BEReader.readUint16(this.buffer, this.offset);
        this.offset+=2;
        return r;
    }

    uint32() {
        let r = BEReader.readUint32(this.buffer, this.offset);
        this.offset+=4;
        return r;
    }
}