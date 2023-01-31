import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import path from 'path';
import { authenticator } from 'otplib';

const email = 'jomael@outdoorequipped.com';
const password = 'qFNz3Kyx';


//text area with content - { sku: 'NS-311659K280_11', asin: 'B004QL9NWK'}
//text area without content - { sku: 'DUP_SMB-4048-9D', asin: 'B072MRG5DT'}
//input without content - { sku: 'SHR-495NF_BLK_PONY', asin: 'B00CLOV7K0'}
// different tabs - { sku: 'ECK-EC041269010', asin: 'B00M1QZBAK' }

const otpGenerator = (secretKey) => {
	const token = authenticator.generate(secretKey);
	return token;
}

const scraper = async () => {
	let results = [];
    const browser = await puppeteer.launch({ headless: false, slowMo: 70 });
    const page = await browser.newPage();
    const secretValue = 'RNTSYMIYELI4SYBJ6ZAODAGQJCFCOWMWB3IUZVNIPNC6J3CBFYMQ';
    const prodDetails = [{ sku: 'NS-311659K280_11', asin: 'B004QL9NWK'},{ sku: 'DUP_SMB-4048-9D', asin: 'B072MRG5DT'},{ sku: 'SHR-495NF_BLK_PONY', asin: 'B00CLOV7K0'},{ sku: 'ECK-EC041269010', asin: 'B00M1QZBAK' }];
    
	console.log('Accessing Seller Central...');

    await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 });
    await page.goto('https://sellercentral.amazon.com/');
    await page.waitForSelector('#login > div > a > strong');
    await page.click('#login > div > a > strong');
    await page.waitForSelector('#ap_email');
    await page.type('#ap_email',email );
    await page.type('#ap_password', password);
    await page.click('#signInSubmit');
    
    const otpCode = otpGenerator(secretValue);
    await page.waitForSelector('#auth-mfa-otpcode');
    await page.type('#auth-mfa-otpcode',otpCode);
    await page.click('#auth-signin-button');

	console.log('SC: Signed In');

    await page.waitForSelector('#picker-container > div > div.picker-body > div > div:nth-child(3) > div > div:nth-child(3) > button > div > div');
    await page.click('#picker-container > div > div.picker-body > div > div:nth-child(3) > div > div:nth-child(3) > button > div > div');
    await page.click('#picker-container > div > div.picker-footer > div > button');
    await page.waitForSelector('#CardList > div',{timeout:0});

	console.log('Analyzing Seller Central page...');

	for (let x in prodDetails) {
		let prodNum = prodDetails[x];

		console.log('Processing ' + prodNum.asin + '...');

		await page.goto(`https://sellercentral.amazon.com/abis/listing/edit?marketplaceID=ATVPDKIKX0DER&ref=xx_myiedit_cont_myifba&sku=${prodNum.sku}&asin=${prodNum.asin}`);
		await page.waitForSelector('#marathonUI > div > div.marathon-page-container > header > div:nth-child(3) > nav');

		const productHolder = '#product_identity-link';
		try {
			await page.waitForSelector('#product_identity-link');
			const itemName = await page.evaluate(() => {
				document.querySelector('#product_identity-link').click();

				let amazonItemName, oeItemName;
				const katTextArea = 'kat-textarea[name="item_name-0-value"]';
				const katInput = 'kat-input[name="item_name-0-value"]';

				amazonItemName = document.querySelector('#attribute-group-item_name > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span').innerHTML;

				if (document.querySelector(katTextArea)) {
					oeItemName = document.querySelector(katTextArea).getAttribute('value') === null ? 'n/a' : document.querySelector(katTextArea).getAttribute('value');
				} else {
					oeItemName = document.querySelector(katInput).getAttribute('value') === null ? 'n/a' : document.querySelector(katInput).getAttribute('value');
				}
		
				return { amazonItemName, oeItemName };    
			});

			const brandName = await page.evaluate(()=> {
				let amazonBrandName, oeBrandName;
				const predictiveInput = '#attribute-group-brand > section > div > div > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > kat-predictive-input';
				
				amazonBrandName = document.querySelector('#attribute-group-brand > section > div > div > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span').innerHTML;
				oeBrandName = document.querySelector(predictiveInput).getAttribute('value') === '' ? 'n/a' : document.querySelector(predictiveInput).getAttribute('value');
				
				return { amazonBrandName, oeBrandName};
			});

			results.push({ itemName, brandName });
		} catch (error) {
			try {
				const vitalInfo='#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_vital_info > div.kat-row.attributeGroup.attributeGroup-item_name > section > div > section.kat-col-xs-7.field-wrapped > span.reconciledValue--muted';
				await page.click('#tang_vital_info-link')
				await page.waitForSelector(vitalInfo);
				
				const itemName = await page.evaluate(()=>{
					let amazonItemName, oeItemName;

					amazonItemName = document.querySelector('#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_vital_info > div.kat-row.attributeGroup.attributeGroup-item_name > section > div > section.kat-col-xs-7.field-wrapped > span.reconciledValue--muted').innerHTML;
					oeItemName = document.querySelector('kat-input[id="item_name"]').getAttribute('value') === '' ? oeItemName = 'n/a' : document.querySelector('kat-input[id="item_name"]').getAttribute('value')

					return ({ amazonItemName, oeItemName });
				})

				const brandName = await page.evaluate(()=>{
					let amazonBrandName, oeBrandName;

					amazonBrandName = document.querySelector('#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_vital_info > div.kat-row.attributeGroup.attributeGroup-brand > section > div > section.kat-col-xs-7 > span.reconciledValue--muted').innerHTML;
					oeBrandName = document.querySelector('kat-predictive-input[id="brand_name"]').getAttribute('value') === '' ? oeBrandName ='n/a' : document.querySelector('kat-predictive-input[id="brand_name"]').getAttribute('value');

					return { amazonBrandName, oeBrandName};
				})

				results.push({ itemName, brandName });

			} catch (error) {
				results.push({ itemName: 'Tab does not exist!', brandName: 'Tab does not exist!' });
			}

		}

		try {
			await page.click('#product_details');
			await page.waitForSelector('#attribute-group-product_description > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7');
			
			const productDescription = await page.evaluate(()=> {
				let amazonProductDescription, oeProductDescription;
				const aprodDesc='#attribute-group-product_description > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span';
				const oeprodDesc='#attribute-group-product_description > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > kat-input';
				
				amazonProductDescription = document.querySelector(aprodDesc) ? document.querySelector(aprodDesc).innerHTML : 'n/a';
				oeProductDescription = document.querySelector(oeprodDesc).getAttribute('value') === null ? 'n/a' : document.querySelector(oeprodDesc).getAttribute('value');
				
				return { amazonProductDescription, oeProductDescription };
			});
		
			await page.waitForSelector('#attribute-group-bullet_point > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span');
			const bulletPoint = await page.evaluate(()=> {
				let amazonBulletPoint=[], oeBulletPoint=[];
				let abpLink='#attribute-group-bullet_point > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span';

				if(document.querySelector(abpLink)===''){
					amazonBulletPoint=["n/a"];
				} else {
					amazonBulletPoint.push(document.querySelector(abpLink).innerHTML);
					for(let i=1; i < 20; i+=2){
						try{
						amazonBulletPoint.push(document.querySelector(`#attribute-group-bullet_point > section > div > div > div.hide-label > div:nth-child(${i}) > section.kat-col-xs-7 > span`).innerHTML);
						} catch (error) {
						break;
						}
					}
					
					for(let i = 1; i < 20; i++){
						try {
							if(document.querySelector(`kat-input[name="bullet_point-0-value"]`).getAttribute('value')===null){
								oeBulletPoint='n/a';
							}else{
								oeBulletPoint.push(document.querySelector(`kat-input[name="bullet_point-${i}-value"]`).getAttribute('value'));
							} 
						} catch (error) {
							break;
						}
					}
				}

				amazonBulletPoint = amazonBulletPoint.toString(); //temp
				oeBulletPoint = oeBulletPoint.toString(); //temp
				
				return { amazonBulletPoint, oeBulletPoint };
			});
		
			const genericKeywords = await page.evaluate(()=>{
				let amazonGenericKeywords, oeGenericKeywords;
				const aGenericKeywords=('#attribute-group-generic_keyword > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span')
		
				amazonGenericKeywords= document.querySelector(aGenericKeywords).innerHTML;
				oeGenericKeywords= document.querySelector('kat-input[name="generic_keyword-0-value"]').getAttribute('value')===null ? oeGenericKeywords='n/a' : document.querySelector('kat-input[name="generic_keyword-0-value"]').getAttribute('value');
		
				return { amazonGenericKeywords, oeGenericKeywords};
			});

			results.push({ productDescription, bulletPoint, genericKeywords });

		} catch (error) {
			try {
				await page.click('#tang_description-link');
				await page.waitForSelector('#product_description');

				const productDescription = await page.evaluate(()=>{
					let amazonProductDescription, oeProductDescription;

					amazonProductDescription = 'n/a';
					oeProductDescription = document.querySelector('#product_description').getAttribute('value') === '' ? oeProductDescription = 'n/a' : document.querySelector('#product_description').getAttribute('value');

					return { amazonProductDescription, oeProductDescription };
				})

				const bulletPoint = await page.evaluate(()=>{
					let amazonBulletPoint, oeBulletPoint;

					amazonBulletPoint = document.querySelector('#bullet_point-multi-valued-container > div > section.kat-col-xs-7.field-wrapped.no-padding-left > span.reconciledValue--muted').innerHTML;
					oeBulletPoint = document.querySelector('kat-input[id="bullet_point1"]').getAttribute('value') === '' ? oeBulletPoint = 'n/a' : document.querySelector('kat-input[id="bullet_point1"]').getAttribute('value');

					return { amazonBulletPoint, oeBulletPoint };
				})

				await page.click('#tang_keywords-link');
				await page.waitForSelector('#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_keywords > div > section > div > section.kat-col-xs-7.field-wrapped > span.reconciledValue--muted')

				const genericKeywords= await page.evaluate(()=>{
					let amazonGenericKeywords, oeGenericKeywords;

					amazonGenericKeywords = document.querySelector('#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_keywords > div > section > div > section.kat-col-xs-7.field-wrapped > span.reconciledValue--muted').innerHTML;
					oeGenericKeywords = document.querySelector('kat-input[id="generic_keywords"]').getAttribute('value') === '' ? oeGenericKeywords = 'n/a' : document.querySelector('kat-input[id="generic_keywords"]').getAttribute('value');

					return { amazonGenericKeywords,oeGenericKeywords }
				})

				results.push({ productDescription, bulletPoint, genericKeywords });

			} catch (error) {        
				results.push({  productDescription: 'Tab does not exist!', bulletPoint: 'Tab does not exist!', genericKeywords: 'Tab does not exist!' });
			}
		}

		console.log(prodNum.asin + ' - done!')
	};
    
    console.log(results);
    await browser.close();
}

scraper();


// Item Name
// Brand Name
// Product Description
// Bullet Point
// Generic Keywords
