import { window, workspace } from 'vscode';
import { join } from 'path';
import { jsonc } from 'jsonc';

import { Instruction, InstructionHandler } from './instructions';
import * as instructionHandlers from './instruction-handlers';
import { existsAsync, mkdirIfNotExists } from './utils';

export const init = async () => {
  if (!workspace.workspaceFolders) {
    return;
  }
  const workspaceFolder = workspace.workspaceFolders[0].uri.fsPath;

  const json = await jsonc.read(
    join(__dirname, '..', 'examples', 'init', 'instructions.json')
  );

  const dir = join(workspaceFolder, '.presentation-buddy');
  const fileName = join(dir, 'instructions.json');
  if (await existsAsync(fileName)) {
    window.showWarningMessage(
      `File ${fileName} exists: overwrite it?`, "Yes", "No"
    ).then(async answer => {
      if (answer === "Yes") {
        await jsonc.write(fileName, json, { space: 2 });
       };
    });
  } else {
    await mkdirIfNotExists(dir);
    await jsonc.write(fileName, json, { space: 2 });
  }
};

export const start = async () => {
  if (!workspace.workspaceFolders) {
    return;
  }
  const workspaceFolder = workspace.workspaceFolders[0].uri.fsPath;

  const instructions = await loadInstructions(workspaceFolder);
  let instruction = instructions.shift();

  while (instruction) {
    const handler = instructionHandlers[instruction.type] as InstructionHandler;

    if (handler) {
      await handler(instruction);
    } else {
      window.showErrorMessage(`Unkown instruction type '${instruction.type}'`);
    }

    instruction = instructions.shift();
  }

  console.log(instructions);
};

async function loadInstructions(
  workspaceFolder: string
): Promise<Instruction[]> {
  const path = join(
    workspaceFolder,
    '.presentation-buddy',
    'instructions.json'
  );
  const instructions: Instruction[] = await jsonc.read(path);

  return instructions.filter((instruction) => !instruction.skip);
}
