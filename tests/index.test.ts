// processHTML.test.ts
import fs from 'fs';
import { processHTMLFiles } from '../src/index';
import { jest } from '@jest/globals';

const mockedFs = jest.mocked(fs);


describe('processHTMLFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a meta tag with the hash to each HTML file', () => {
    mockedFs.readdirSync.mockReturnValue(['test1.html', 'test2.html']);
    fs.statSync.mockReturnValue({ isDirectory: () => false });
    fs.readFileSync.mockReturnValue('<html><body><div style="color: red;"></div></body></html>');

    const directoryPath = './testHTMLFiles';
    const config = { cspHeaderName: 'Content-Security-Policy' };
    processHTMLFiles(directoryPath, config);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(1, 'testHTMLFiles/test1.html', expect.any(String), 'utf8');
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(2, 'testHTMLFiles/test2.html', expect.any(String), 'utf8');
  });

  it('should log an error if the configuration file is not found', () => {
    fs.readdirSync.mockReturnValue([]);
    const consoleErrorSpy = jest.spyOn(console, 'error');

    const directoryPath = './nonexistentDirectory';
    const config = { cspHeaderName: 'Content-Security-Policy' };
    processHTMLFiles(directoryPath, config);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading config file: Error: Cannot find module \'./nonexistentDirectory/config.js\'');
    consoleErrorSpy.mockRestore();
  });

  // Add more specific test cases as needed
});