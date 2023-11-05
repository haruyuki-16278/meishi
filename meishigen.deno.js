#!/usr/bin/env -S deno run --allow-read --allow-write

import { PDFDocument, rgb, PageSizes, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@%5E1.7.0';
import pdfLibfontkit from 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/+esm';

/** 編集の基本になるPDFデータ */
const pdfDoc = await PDFDocument.create();
pdfDoc.registerFontkit(pdfLibfontkit);

/** 1mmの大きさ */
const oneMilliMeter = PageSizes.B5[0] / 182;
console.log(oneMilliMeter);

// ----- コマンドライン引数の処理ここから -----
const args = Deno.args;
const font = args.includes('--font')
              ? await pdfDoc.embedFont(await Deno.readFile(args[args.indexOf('--font') + 1]))
              : await pdfDoc.embedFont(StandardFonts.Helvetica);
const showblock = args.includes('--block');
// ----- コマンドライン引数の処理ここまで -----

// JSDocの型準備
/**
 * @typedef placementOption
 * @property {number} x
 * @property {number} y
 * @property {'left'|'center'|'right'|undefined} horizontalPlacement
 * @property {'top'|'center'|'bottom'|undefined} verticalPlacement
 */

/**
 * 配置する座標を配置のオプションから取得する
 * @param {placementOption} placement
 * @param {{width: number, height: number}} itemSize
 * @returns {{x: number, y: number}}
 */
const calcCoordFromPlacement = (placement, itemSize) => {
  let x, y;
  switch (placement.horizontalPlacement) {
    case 'center':
      x = placement.x - (itemSize.width / 2);
      break;
    case 'right':
      x = placement.x - itemSize.width;
      break;
    case 'left':
    default:
      x = placement.x;
  }
  switch (placement.verticalPlacement) {
    case 'center':
      y = placement.y - (itemSize.height / 2);
      break;
    case 'top':
      y = placement.y - itemSize.height;
      break;
    case 'bottom':
    default:
      y = placement.y;
      break;
  }
  return {x: x, y: y}
}

/**
 * @param {any} page 
 * @param {string} text 
 * @param {number} textFontSize 
 * @param {placementOption} placement 
 */
const drawText = (
  page,
  text,
  textFontSize,
  placement,
  color
) => {
  const textSize = {
    width: font.widthOfTextAtSize(text, textFontSize),
    height: font.heightAtSize(textFontSize)
  };
  const {x, y} = calcCoordFromPlacement(placement, textSize);
  page.drawText(text, {
    x: x,
    y: y,
    size: textFontSize,
    font: font,
    color: color
  });
  if (showblock) page.drawRectangle({
    x: x,
    y: y,
    width: textSize.width,
    height: textSize.height,
    borderColor: rgb(1, 0, 0),
    borderWidth: 1.5,
  })
}

/**
 * @param {any} page
 * @param {string} path
 * @param {number} scale
 * @param {placementOption} placement
 */
const drawPicture = async (page, path, scale, placement) => {
  let image;
  if (path.includes('.png')) {
    image = await pdfDoc.embedPng(await Deno.readFile(path));
  }
  else if (path.includes('.jpg')) {
    image = await pdfDoc.embedJpg(await Deno.readFile(path));
  } else {
    throw new Error('Support ONLY png and jpg');
  }
  const imageSize = await image.scale(scale);
  const {x, y} = calcCoordFromPlacement(placement, imageSize);
  page.drawImage(image, {
    x: x,
    y: y,
    width: imageSize.width,
    height: imageSize.height
  });
}

const japaneseMeishiSize = [91 * oneMilliMeter, 55 * oneMilliMeter];

console.log(japaneseMeishiSize);

const omote = pdfDoc.addPage(japaneseMeishiSize);
const { width, height } = omote.getSize();
omote.drawRectangle({
  x: 0,
  y: 0,
  width: width,
  height: height,
  color: rgb(0.9725, 0.9725, 1)
});
drawText(omote, 'はるゆき', 24, {
  x: width * 0.35,
  y: height * 0.9,
  horizontalPlacement: 'left',
  verticalPlacement: 'top'
});
drawText(omote, 'X:@haruyuki_16278', 10, {
  x: width* 0.35,
  y: height * 0.6,
  horizontalPlacement: 'left',
  verticalPlacement: 'top'
});
drawText(omote, 'mail:haruyuki@relicsnow.info', 10, {
  x: width* 0.35,
  y: height * 0.6 - 12,
  horizontalPlacement: 'left',
  verticalPlacement: 'top'
});
omote.drawRectangle({
  x: width - 10 - 10,
  y: 10,
  width: 10,
  height: 10,
  color: rgb(0xC8 / 256, 0x3C / 256, 0x35 / 256)
});
omote.drawRectangle({
  x: width -10 - 5- 10 - 10,
  y: 10,
  width: 10,
  height: 10,
  color: rgb(0xB4 / 256, 0xE9 / 256, 0xFF / 256)
});
omote.drawRectangle({
  x: width -10 -5 -10 - 5- 10 - 10,
  y: 10,
  width: 10,
  height: 10,
  color: rgb(0xFF / 256, 0xB8 / 256, 0x00 / 256)
});
await drawPicture(omote, 'icon.jpg', 0.15, {
  x: width * 0.1 - 5,
  y: height * 0.6,
  horizontalPlacement: 'left',
  verticalPlacement: 'center'
});
await drawPicture(omote, 'QR.png', 0.03, {
  x: width * 0.1 - 5,
  y: 20,
  horizontalPlacement: 'left',
  verticalPlacement: 'bottom'
});
await drawPicture(omote, 'websiteplanet-qr.png', 0.03, {
  x: width * 0.1 - 5 + width * 0.15 + 5,
  y: 19,
  horizontalPlacement: 'left',
  verticalPlacement: 'bottom'
});

const ura = pdfDoc.addPage(japaneseMeishiSize);
const uraSize = omote.getSize();

await drawPicture(ura, 'icon.png', 0.1, {
  x: uraSize.width / 2,
  y: uraSize.height / 2,
  horizontalPlacement: 'center',
  verticalPlacement: 'center'
});

const pdfBytes = await pdfDoc.save();
await Deno.writeFile('meishi.pdf', pdfBytes);

