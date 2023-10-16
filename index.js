const puppeteer = require('puppeteer');
//const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path'); // Додайте цей рядок
const express = require("express");
const app = express();

var ClosureCompiler = require('google-closure-compiler').compiler;

const site_correct =
{
    id: 234252666,
    site_url: 'sht.nik',
    secret_key: 'w04856309485gj03w9485g',
};

const port = 5000;
app.listen(port, (req, res) => {
    console.log(`Server start on port ${port}`);
});

app.use(express.json());
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to this server!!!'
    })
});
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to this api server!!!'
    })
});
app.post('/api/homemobile', (req, res) => {
    const body = req.body;
    let error_text = [];
    if (req.body.id != site_correct.id) {
        error_text += 'ERROR id... ';
    }
    if (req.body.site_url != site_correct.site_url) {
        error_text += 'ERROR site_url... ';
    }
    if (req.body.secret_key != site_correct.secret_key) {
        error_text += 'ERROR secret_key...';
    }
    if (req.body.site_url_page == '') {
        error_text += 'ERROR site_url_page... ';
    }

    if (error_text.length) {
        res.status(201).json({
            error_text
        })
        res.end();
    } else {
        let site_url_page = req.body.site_url_page;
        generateCoverageParMobile(req.body.site_url_page, req.body.page_send_cov, req.body.css_id_or_class_click, req.body.css_id_or_class_hover).then(([json, page_send_cov, resultItem]) => {
            res.status(200).json({
                page_send_cov: page_send_cov,
                status: 200,
                message: json,
                resultItem: resultItem
            })
            res.end();
        }).catch(error => {
            // /movies or /categories request failed
            res.status(203).json({
                error: error
            })
            res.end();
        });
    }
});
app.post('/api/homedesctop', (req, res) => {
    const body = req.body;
    let error_text = [];
    if (req.body.id != site_correct.id) {
        error_text += 'ERROR id... ';
    }
    if (req.body.site_url != site_correct.site_url) {
        error_text += 'ERROR site_url... ';
    }
    if (req.body.secret_key != site_correct.secret_key) {
        error_text += 'ERROR secret_key...';
    }
    if (req.body.site_url_page == '') {
        error_text += 'ERROR site_url_page... ';
    }

    if (error_text.length) {
        res.status(201).json({
            error_text
        })
        res.end();
    } else {
        let site_url_page = req.body.site_url_page;
        generateCoveragePar(req.body.site_url_page, req.body.page_send_cov, req.body.css_id_or_class_click, req.body.css_id_or_class_hover).then(([json, page_send_cov, resultItem]) => {
            res.status(200).json({
                page_send_cov: page_send_cov,
                status: 200,
                message: json,
                resultItem: resultItem
            })
            res.end();
        }).catch(error => {
            // /movies or /categories request failed
            res.status(203).json({
                error: error
            })
            res.end();
        });
    }
});

async function generateCoverageParMobile(site_url_page = "", page_send_cov = '', css_id_or_class_click = '', css_id_or_class_hover = '') {
    try {
        console.log('site_url_page' + site_url_page);
        console.log('page_send_cov' + page_send_cov);
        console.log('Start async function desctop');

        let resultItem = "";
        // Launch the browser and open a new blank page
        //const browser = await puppeteer.launch({ headless: 'new', executablePath: '/opt/google/chrome/chrome' });

        // Перевірте елементи у масиві


        var browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });

        /* !!!! IS correct   */
        /*var browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox'],
            defaultViewport: {width: 1920, height: 1080}
    	
        });*/


        console.log(browser);
        console.log('11111111111');
        var page = await browser.newPage();
        console.log(page);
        // Set screen sizess
        await page.setViewport({ width: 360, height: 576 });

        // Navigate the page to a URL
        await page.goto(site_url_page);

        await page.waitForSelector('.min-footer');

        //await page.coverage.startCSSCoverage();
        // Start recording JS and CSS coverage data
        await Promise.all([
            page.coverage.startJSCoverage(),
            page.coverage.startCSSCoverage()
        ]);

        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        async function performActions(css_selector, actionType) {
            if (css_selector.length === 0) return;

            const selectors = css_selector.split("/").filter(e => e != '');

            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });

                    if (actionType === 'click') {
                        await page.click(selector);
                        resultItem += `<p>Click on an item with selector: <strong>${selector}</strong></p>`;
                        console.log(`Click on an item with selector: ${selector}`);
                    } else if (actionType === 'hover') {
                        const elementHandle = await page.$(selector);
                        await elementHandle.hover();
                        resultItem += `<p>Cursor pointed to element with selector: <strong>${selector}</strong></p>`;
                        console.log(`Cursor pointed to element with selector: ${selector}`);
                    }
                } catch (error) {
                    resultItem += `<p>The element with selector <strong>${selector}</strong> was not found or is not available.</p>`;
                    console.error(`The element with selector ${selector} was not found or is not available.`);
                }
            }
        }

        await performActions(css_id_or_class_click, 'click');
        await performActions(css_id_or_class_hover, 'hover');
      

        const coverageCSS = await page.coverage.stopCSSCoverage();
        const coverageJs = await page.coverage.stopJSCoverage();

        // Save the converted obj to string
        const jsoncss = JSON.stringify(coverageCSS);
        const jsonjs = JSON.stringify(coverageJs);

        /* Converted css optimization (works with the obj) */
        const data_css = coverageCSS;
        let covered_css = '';
        for (let entry of data_css) {
            for (let text_all_css of entry.ranges) {
                covered_css += entry.text.slice(text_all_css.start, text_all_css.end) + "\n";
            }
        }

        /*
        const flags = {
            jsCode: [{src: './page-site/js_my/jquery.flexslider.min.js'}],
        };
          const out = ClosureCompiler(flags);
          console.log (flags);
        */

        /*
        //start JS
        var inputString = '';
                var findme = "jquery.flexslider.min.js";
                const data_js = coverageJs;
                let covered_js = '';

                for (let entry of data_js) { 
                    inputString = entry.url;
                    //console.log (typeof(entry.url)); 
                        if ( inputString.indexOf(findme) > -1 ) {
                            console.log (inputString);
                        }                    
                    //for (let text_all_css of entry.ranges) {
                    //covered_css += entry.text.slice(text_all_css.start, text_all_css.end) + "\n";
                    //}                    
                }

        //end JS
        */
        /* END Converted css optimization */
        /*
        if (data.url.includes(combined_css)) {
            for (const range of data.ranges) {
                const length = range.end - range.start;
                css.push(data.text.substring(range.start, range.start + length));
            }
            break;
        }
        */
        await browser.close();
        console.log('mob end_convert page ' + page_send_cov);
        return [covered_css, page_send_cov, resultItem];
    } catch (error) {
        console.log(error.response.body);
    }
};


async function generateCoveragePar(site_url_page = "", page_send_cov = '', css_id_or_class_click = '', css_id_or_class_hover = '') {
    try {
        console.log('site_url_page' + site_url_page);
        console.log('page_send_cov' + page_send_cov);
        console.log('Start async function desctop');

        let resultItem = "";
        // Launch the browser and open a new blank page
        //const browser = await puppeteer.launch({ headless: 'new', executablePath: '/opt/google/chrome/chrome' });

        // Перевірте елементи у масиві


        var browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });

        /* !!!! IS correct   */
        /*var browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox'],
            defaultViewport: {width: 1920, height: 1080}
    	
        });*/


        console.log(browser);
        console.log('11111111111');
        var page = await browser.newPage();
        console.log(page);
        // Set screen size
        await page.setViewport({ width: 1366, height: 768 });

        // Navigate the page to a URL
        await page.goto(site_url_page);

        await page.waitForSelector('.min-footer');

        //await page.coverage.startCSSCoverage();
        // Start recording JS and CSS coverage data
        await Promise.all([
            page.coverage.startJSCoverage(),
            page.coverage.startCSSCoverage()
        ]);

        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        async function performActions(css_selector, actionType) {
            if (css_selector.length === 0) return;

            const selectors = css_selector.split("/").filter(e => e != '');

            for (const selector of selectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });

                    if (actionType === 'click') {
                        await page.click(selector);
                        resultItem += `<p>Click on an item with selector: <strong>${selector}</strong></p>`;
                        console.log(`Click on an item with selector: ${selector}`);
                    } else if (actionType === 'hover') {
                        const elementHandle = await page.$(selector);
                        await elementHandle.hover();
                        resultItem += `<p>Cursor pointed to element with selector: <strong>${selector}</strong></p>`;
                        console.log(`Cursor pointed to element with selector: ${selector}`);
                    }
                } catch (error) {
                    resultItem += `<p>The element with selector <strong>${selector}</strong> was not found or is not available.</p>`;
                    console.error(`The element with selector ${selector} was not found or is not available.`);
                }
            }
        }

        await performActions(css_id_or_class_click, 'click');
        await performActions(css_id_or_class_hover, 'hover');


        const coverageCSS = await page.coverage.stopCSSCoverage();
        const coverageJs = await page.coverage.stopJSCoverage();

        // Save the converted obj to string
        const jsoncss = JSON.stringify(coverageCSS);
        const jsonjs = JSON.stringify(coverageJs);

        /* Converted css optimization (works with the obj) */
        const data_css = coverageCSS;
        let covered_css = '';
        for (let entry of data_css) {
            for (let text_all_css of entry.ranges) {
                covered_css += entry.text.slice(text_all_css.start, text_all_css.end) + "\n";
            }
        }

        /*
        const flags = {
            jsCode: [{src: './page-site/js_my/jquery.flexslider.min.js'}],
        };
          const out = ClosureCompiler(flags);
          console.log (flags);
        */

        /*
        //start JS
        var inputString = '';
                var findme = "jquery.flexslider.min.js";
                const data_js = coverageJs;
                let covered_js = '';

                for (let entry of data_js) { 
                    inputString = entry.url;
                    //console.log (typeof(entry.url)); 
                        if ( inputString.indexOf(findme) > -1 ) {
                            console.log (inputString);
                        }                    
                    //for (let text_all_css of entry.ranges) {
                    //covered_css += entry.text.slice(text_all_css.start, text_all_css.end) + "\n";
                    //}                    
                }

        //end JS
        */
        /* END Converted css optimization */
        /*
        if (data.url.includes(combined_css)) {
            for (const range of data.ranges) {
                const length = range.end - range.start;
                css.push(data.text.substring(range.start, range.start + length));
            }
            break;
        }
        */
        await browser.close();
        console.log('end_convert page ' + page_send_cov);
        return [covered_css, page_send_cov, resultItem];
    } catch (error) {
        console.log(error.response.body);
    }
};




/*
const flags = {
  jsCode: [{src: 'const x = 1 + 2;'}],
};
const out = ClosureCompiler(flags);
console.info(out.ClosureCompiler);  // will print 'var x = 3;\n'
*/




