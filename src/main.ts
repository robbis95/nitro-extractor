import * as fs from "fs";
import { NitroBundle } from "./NitroBundle";
import { NitroBundler } from "./NitroBundler";
import { writeFile } from "fs/promises";

class NitroExtractor {
  constructor() {
    console.clear();

    this.start();
  }

  private async start(): Promise<void> {
    this.create();
    //

    this.extractFiles("furni");
    this.extractFiles("clothing");
    this.extractFiles("effects");
    this.extractFiles("pets");

    //

    this.compileFiles("furni");
    this.compileFiles("clothing");
    this.compileFiles("effects");
    this.compileFiles("pets");

    //

    this.generateSQLQueries("furni");
    this.generateSQLQueries("clothing");
    this.generateSQLQueries("effects");
    this.generateSQLQueries("pets");
  }

  private create(): void {
    if (fs.existsSync("assets")) return;

    fs.mkdirSync("assets");

    let arr = ["compile", "compiled", "extract", "extracted"];
    let arr2 = ["furni", "clothing", "effects", "pets"];

    arr.forEach((el) => {
      fs.mkdirSync(`assets/${el}`);

      arr2.forEach((ele) => {
        fs.mkdir(`assets/${el}/${ele}`, () => {});
      });
    });
  }

  private extractFiles(folder: string) {
    fs.readdir(`assets/extract/${folder}`, (err, files) => {
      if (!files) return;
      console.log(`extracting ${files.length} ${folder}`);
      files.forEach((file) => {
        fs.readFile(`assets/extract/${folder}/${file}`, (err, data) => {
          const bundle = new NitroBundle(new Uint8Array(data).buffer);

          const name = file.split(".nitro")[0];

          fs.mkdir(`assets/extracted/${folder}/${name}`, (err) => {});

          fs.writeFile(
            `assets/extracted/${folder}/${name}/${name}.json`,
            JSON.stringify(bundle.jsonFile, null, 4),
            "utf-8",
            () => {}
          );

          fs.writeFile(
            `assets/extracted/${folder}/${name}/${name}.png`,
            bundle.baseTexture,
            "base64",
            () => {}
          );
        });
      });
    });
  }

  private compileFiles(folder: string) {
    fs.readdir(`assets/compile/${folder}`, async (err, files) => {
      if (!files) return;

      files.forEach(async (file) => {
        console.log(`compiling ${files.length} ${folder}`);

        const nitroBundle = new NitroBundler();
        const assets = fs.readdirSync(`assets/compile/${folder}/${file}`);

        assets.forEach((asset) => {
          const data = fs.readFileSync(
            `assets/compile/${folder}/${file}/${asset}`
          );
          nitroBundle.addFile(asset, data);
        });

        await writeFile(
          `assets/compiled/${folder}/${file}.nitro`,
          await nitroBundle.toBufferAsync()
        );
      });
    });
  }

  private generateSQLQueries(folder: string) {
    fs.readdir(`assets/extracted/${folder}`, (err, files) => {
      if (!files) return;
      let sqlQueries: string[] = [];

      files.forEach((file) => {
        const jsonPath = `assets/extracted/${folder}/${file}/${file}.json`;
        fs.readFile(jsonPath, "utf-8", (err, jsonData) => {
          if (err) {
            console.error("Error reading JSON file:", err);
            return;
          }
          const jsonObject = JSON.parse(jsonData);

          // Extract furniture properties and generate SQL queries
          // This assumes a specific JSON structure; modify it based on the actual structure
          for (const furniture of jsonObject.furnitures) {
            const query = this.generateSingleSQLQuery(furniture);
            sqlQueries.push(query);
          }

          // Save SQL queries to a file
          fs.writeFile(
            `assets/extracted/${folder}/${file}/sql_queries.sql`,
            sqlQueries.join("\n"),
            "utf-8",
            () => {}
          );
        });
      });
    });
  }

  private generateSingleSQLQuery(item: any): string {
    function booleanToInt(booleanValue: boolean): number {
      return booleanValue ? 1 : 0;
    }

    const query = `
      INSERT INTO items_base (
        sprite_id, public_name, item_name, type, width, length, stack_height,
        allow_stack, allow_walk, allow_sit, allow_lay, interaction_type,
        interaction_modes_count
      ) VALUES (
        '${item.sprite_id}', '${item.public_name.replace(/'/g, "\\'")}',
        '${item.item_name}', '${item.type}', ${item.width},
        ${item.length}, '${item.stack_height}',
        ${booleanToInt(item.allow_stack)},
        ${booleanToInt(item.allow_walk)},
        ${booleanToInt(item.allow_sit)},
        ${booleanToInt(item.allow_lay)},
        '${item.interaction_type === "bed" ? "default" : item.interaction_type}',
        ${item.interaction_modes_count}
      );
    `;
    return query.trim();
  }
}

new NitroExtractor();
