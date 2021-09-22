import * as fs from 'fs';
import { NitroBundle } from './NitroBundle';
import { NitroBundler } from './NitroBundler';
import { writeFile } from 'fs/promises';

/*
 *  my ass does not take credit for any of this code.
 *  i've just created a new tool from existing code. 
 *  -Layne
 */
class NitroExtractor
{
    constructor()
    {
        console.clear();

        this.start()
    }

    private async start(): Promise<void>
    {
        this.create();
        //

        this.extractFiles('furni');
        this.extractFiles('clothing');
        this.extractFiles('effects');
        this.extractFiles('pets');

        //

        this.compileFiles('furni');
        this.compileFiles('clothing');
        this.compileFiles('effects');
        this.compileFiles('pets');
    }

    private create(): void
    {
        if (fs.existsSync('assets')) return;

        fs.mkdirSync('assets');
        
        let arr = ['compile','compiled','extract','extracted']
        let arr2 = ['furni', 'clothing', 'effects', 'pets'];

        arr.forEach(el =>
        {
            fs.mkdirSync(`assets/${el}`);

            arr2.forEach((ele) =>
            {
                fs.mkdir(`assets/${el}/${ele}`, () => { });
            })
        });
    }
    
    private extractFiles(folder: string)
    {
        fs.readdir(`assets/extract/${folder}`, (err, files) =>
        {
            if (!files) return;
            console.log(`extracting ${files.length} ${folder}`)
            files.forEach(file =>
            {
                fs.readFile(`assets/extract/${folder}/${file}`, (err, data) =>
                {
                    const bundle = new NitroBundle(new Uint8Array(data).buffer);

                    const name = file.split('.nitro')[0];

                    fs.mkdir(`assets/extracted/${folder}/${name}`, (err) => { });
                    
                    fs.writeFile(`assets/extracted/${folder}/${name}/${name}.json`, JSON.stringify(bundle.jsonFile, null, 4), 'utf-8', () => { })

                    fs.writeFile(`assets/extracted/${folder}/${name}/${name}.png`, bundle.baseTexture, 'base64', () => { });
                 })
            });
        });
    }

    private compileFiles(folder: string)
    {
        fs.readdir(`assets/compile/${folder}`, async (err, files) =>
        {
            if (!files) return;

            files.forEach(async file =>
            {
                console.log(`compiling ${files.length} ${folder}`);

                const nitroBundle = new NitroBundler();
                const assets = fs.readdirSync(`assets/compile/${folder}/${file}`);

                assets.forEach(asset =>
                {
                    const data = fs.readFileSync(`assets/compile/${folder}/${file}/${asset}`);
                    nitroBundle.addFile(asset, data);
                });

                await writeFile(`assets/compiled/${folder}/${file}.nitro`, await nitroBundle.toBufferAsync());
            });
        })
    }
}

new NitroExtractor();