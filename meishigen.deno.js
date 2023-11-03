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
drawText(omote, 'Haruyuki', 24, {
  x: width / 2,
  y: height / 2 + 10,
  horizontalPlacement: 'center',
  verticalPlacement: 'center'
});
await drawPicture(omote, 'icon.jpg', 0.1, {
  x: width * 0.1,
  y: height / 2,
  horizontalPlacement: 'left',
  verticalPlacement: 'center'
})

const pdfBytes = await pdfDoc.save();
await Deno.writeFile('meishi.pdf', pdfBytes);

