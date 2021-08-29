import { BinaryReader } from "./BinaryReader";
import { Data, inflate } from 'pako';
import * as atob from 'atob'

export class NitroBundle
{
    private static TEXT_DECODER: TextDecoder = new TextDecoder('utf-8');

    private _jsonFile: Object = null;
    private _image: string = null;
    private _imageData: Uint8Array = null;
    private _baseTexture: string = null;

    constructor(arrayBuffer: ArrayBuffer)
    {
        this.parse(arrayBuffer);
    }

    private static arrayBufferToBase64(buffer: ArrayBuffer): string
    {
        let binary = '';

        const bytes = new Uint8Array(buffer);
        const len   = bytes.byteLength;

        for(let i = 0; i < len; i++) (binary += String.fromCharCode(bytes[i]));

        const newBuffer = Buffer.from(binary.toString(), 'binary');

        return newBuffer.toString('base64');
    }

    public parse(arrayBuffer: ArrayBuffer): void
    {
        const binaryReader = new BinaryReader(arrayBuffer);

        let fileCount = binaryReader.readShort();

        while(fileCount > 0)
        {
            const fileNameLength    = binaryReader.readShort();
            const fileName          = binaryReader.readBytes(fileNameLength).toString();
            const fileLength        = binaryReader.readInt();
            const buffer            = binaryReader.readBytes(fileLength);

            if(fileName.endsWith('.json'))
            {
                const decompressed = inflate((buffer.toArrayBuffer() as Data));

                this._jsonFile = JSON.parse(NitroBundle.TEXT_DECODER.decode(decompressed));
            }
            else
            {
                const decompressed  = inflate((buffer.toArrayBuffer() as Data));
                const base64        = NitroBundle.arrayBufferToBase64(decompressed);

                this._baseTexture = base64;
            }

            fileCount--;
        }
    }

    get jsonFile(): Object
    {
        return this._jsonFile;
    }

    public get baseTexture(): string
    {
        return this._baseTexture;
    }
}
