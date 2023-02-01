import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import path from 'path';
import { authenticator } from 'otplib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const email = 'jomael@outdoorequipped.com';
const password = 'qFNz3Kyx';

const otpGenerator = (secretKey) => {
	const token = authenticator.generate(secretKey);
	return token;
}

const exportScraper = async(results) => {
	try {
		
	} catch (error) {
		
	}
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('SC Edit Page Results');
  
	worksheet.columns = [
		{key: 'sku', header: 'SKU'},
		{key: 'asin', header: 'ASIN'},
		{key: 'oeItemName', header: 'OE Item Name'},
		{key: 'amzItemName', header: 'Amazon Item Name'},
		{key: 'oeBrandName', header: 'OE Brand Name'},
		{key: 'amzBrandName', header: 'Amazon Brand Name'},
		{key: 'oeProdDesc', header: 'OE Product Descriptions'},
		{key: 'amzProdDesc', header: 'Amazon Product Descriptions'},
		{key: 'oeBullPts', header: 'OE Bullet Points'},
		{key: 'amzBullPts', header: 'Amazon Bullet Points'},
		{key: 'oeGenKeys', header: 'OE Generic Keywords'},
		{key: 'amzGenKeys', header: 'Amazon Generic Keywords'},
	];

	results.forEach(item => {
		worksheet.addRow({
			sku: item.sku,
			asin: item.asin,
			oeItemName: item.itemName.oeItemName,
			amzItemName: item.itemName.amazonItemName,
			oeBrandName: item.brandName.oeBrandName,
			amzBrandName: item.brandName.amazonBrandName,
			oeProdDesc: item.productDescription.oeProductDescription,
			amzProdDesc: item.productDescription.amazonProductDescription,
			oeBullPts: item.bulletPoint.oeBulletPoint.toString(),
			amzBullPts: item.bulletPoint.amazonBulletPoint.toString(),
			oeGenKeys: item.genericKeywords.oeGenericKeywords,
			amzGenKeys: item.genericKeywords.amazonGenericKeywords
		})
	})

	const exportPath = path.resolve(__dirname, 'scEditpageScraper.xlsx');
	await workbook.xlsx.writeFile(exportPath);
  
};

const scraper = async () => {
	let results = [];
    const browser = await puppeteer.launch({ headless: true, slowMo: 70 });
    const page = await browser.newPage();
    const secretValue = 'RNTSYMIYELI4SYBJ6ZAODAGQJCFCOWMWB3IUZVNIPNC6J3CBFYMQ';
    const prodDetails = [
		{ sku: 'FRY-FR40097_BRON_9.5M', asin: 'B0B8DSX447'}, 
		{ sku: 'DUP_CWW-W11432-016-M', asin: 'B000ZFPZHI'}, 
		{ sku: 'AS-1081A021-001-11', asin: 'B07KB49XH3' },
		{ sku: 'DUP_SMB-4048-9D', asin: 'B072MRG5DT'},
		{ sku: 'DUP_SM-SW001489_001_L', asin: 'B08RZ99MSY'},
		{ sku: 'DUP_SC_S20689-30_13-M', asin: 'B093ZRZBMW'},
		{ sku: 'DUP_NS-911312B001_6', asin: 'B004QLANBU'},
		{ sku: 'ALB-Grand+Slam+Turkey+Vest', asin: 'B07ZV4TKJ9'},
	]
    
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
    await page.waitForSelector('#CardList > div', { timeout: 0 });

	console.log('Analyzing Seller Central page...');

	for (let x in prodDetails) {
		let prodNum = prodDetails[x];

		console.log('Processing ' + prodNum.asin + '...');

		await page.goto(`https://sellercentral.amazon.com/abis/listing/edit?marketplaceID=ATVPDKIKX0DER&ref=xx_myiedit_cont_myifba&sku=${prodNum.sku}&asin=${prodNum.asin}`);

		const productHolder = '#product_identity-link';
		try {
			await page.waitForSelector('#product_identity-link', { timeout: 10000 });
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

			await page.click('#product_details');
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
						amazonBulletPoint.push((document.querySelector(`#attribute-group-bullet_point > section > div > div > div.hide-label > div:nth-child(${i}) > section.kat-col-xs-7 > span`).innerHTML) + "|");
						} catch (error) {
						break;
						}
					}
					
					for(let i = 1; i < 20; i++){
						try {
							if(document.querySelector(`kat-input[name="bullet_point-0-value"]`).getAttribute('value')===null){
								oeBulletPoint='n/a';
							}else{
								oeBulletPoint.push(document.querySelector(`kat-input[name="bullet_point-${i}-value"]`).getAttribute('value') + "|");
							} 
						} catch (error) {
							break;
						}
					}
				}

				return { amazonBulletPoint, oeBulletPoint };
			});
		
			const genericKeywords = await page.evaluate(()=>{
				let amazonGenericKeywords, oeGenericKeywords;
				const aGenericKeywords=('#attribute-group-generic_keyword > section > div > div > div:nth-child(1) > div.kat-row.kat-row-padding-top-bottom > section.kat-col-xs-7 > span')
		
				amazonGenericKeywords= document.querySelector(aGenericKeywords).innerHTML;
				oeGenericKeywords= document.querySelector('kat-input[name="generic_keyword-0-value"]').getAttribute('value')===null ? oeGenericKeywords='n/a' : document.querySelector('kat-input[name="generic_keyword-0-value"]').getAttribute('value');
		
				return { amazonGenericKeywords, oeGenericKeywords};
			});

			results.push({sku: prodNum.sku, asin: prodNum.asin, itemName, brandName, productDescription, bulletPoint, genericKeywords });
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

				await page.click('#tang_description-link');
				await page.waitForSelector('#product_description');
				const productDescription = await page.evaluate(()=>{
					let amazonProductDescription, oeProductDescription;

					amazonProductDescription = ['n/a'];
					oeProductDescription = document.querySelector('#product_description').getAttribute('value') === '' ? oeProductDescription = 'n/a' : document.querySelector('#product_description').getAttribute('value');

					amazonProductDescription= amazonProductDescription.toString();

					return { amazonProductDescription, oeProductDescription };
				})

				const bulletPoint = await page.evaluate(()=>{
					let amazonBulletPoint=[], oeBulletPoint=[];
					for(let i = 1; i < 20; i++ )
						try {
							amazonBulletPoint.push(document.querySelector(`#bullet_point-multi-valued-container > div:nth-child(${i}) > section.kat-col-xs-7.field-wrapped.no-padding-left > span.reconciledValue--muted`).innerHTML + "|")
						} catch (error) {
							break;
						}
					
					for(let x = 1; x < 20; x++){
						try {
							oeBulletPoint.push(document.querySelector(`kat-input[id="bullet_point${x}"]`).getAttribute('value') + "|");
						} catch (error) {
							break;
						}
					}

					amazonBulletPoint = amazonBulletPoint.toString();
					oeBulletPoint = oeBulletPoint.toString();

					return { amazonBulletPoint, oeBulletPoint };
				})

				await page.click('#tang_keywords-link');
				await page.waitForSelector('#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_keywords > div > section > div > section.kat-col-xs-7.field-wrapped > span.reconciledValue--muted')
				const genericKeywords= await page.evaluate(()=>{
					let amazonGenericKeywords, oeGenericKeywords;

					amazonGenericKeywords = document.querySelector('#default-section > div.ZL1Bz9whxafaDcn8mLJ8 > div.top-padding-15.menu-container-grid.tang_keywords > div > section > div > section.kat-col-xs-7.field-wrapped > span.reconciledValue--muted').innerHTML;
					oeGenericKeywords = document.querySelector('kat-input[id="generic_keywords"]').getAttribute('value') === null ? oeGenericKeywords = 'n/a' : document.querySelector('kat-input[id="generic_keywords"]').getAttribute('value');


					return { amazonGenericKeywords,oeGenericKeywords }
				})

				results.push({ sku: prodNum.sku, asin: prodNum.asin, itemName, brandName, productDescription, bulletPoint, genericKeywords });

			} catch (error) {
				results.push({ itemName: 'Tab does not exist!', brandName: 'Tab does not exist!', productDescription: 'Tab does not exist!', bulletPoint: 'Tab does not exist!', genericKeywords: 'Tab does not exist!' });
			}
		}

		console.log(prodNum.asin + ' - done!')
	};
    
	const writeData = exportScraper(results);
    await browser.close();
}

scraper();


// Item Name
// Brand Name
// Product Description
// Bullet Point
// Generic Keywords
