const puppeteer = require('puppeteer');
const express = require("express");
const app = express();
const CleanCSS = require('clean-css');
const site_correct = {
    id: 234252666,
    site_url: 'sht.nik',
    secret_key: 'w04856309485gj03w9485g',
};

const port = 5000;
app.listen(port, (req, res) => {
    console.log(`Server started on port ${port}`);
});

app.use(express.json());
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to this server!!!'
    });
});
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to this api server!!!'
    });
});
app.post('/api/homemobile', (req, res) => {
    handleApiRequest(req, res, true);
});

app.post('/api/homedesctop', (req, res) => {
    handleApiRequest(req, res, false);
});

async function handleApiRequest(req, res, isMobile) {
    const body = req.body;
    const error_text = [];

    if (Number(body.id) !== Number(site_correct.id)) {
        error_text.push('ERROR id... ');
    }
    if (body.site_url !== site_correct.site_url) {
        error_text.push('ERROR site_url... ');
        console.log('ERROR site_url');
    }
    if (body.secret_key !== site_correct.secret_key) {
        error_text.push('ERROR secret_key...');
        console.log('ERROR secret_key');
    }
    if (body.site_url_page === '') {
        error_text.push('ERROR site_url_page... ');
        console.log('ERROR site_url_page');
    }

    if (error_text.length) {
        res.status(201).json({
            error_text
        });
        res.end();
    } else {
        const site_url_page = body.site_url_page;
        const page_send_cov = body.page_send_cov;
        const css_id_or_class_click = body.css_id_or_class_click;
        const css_id_or_class_hover = body.css_id_or_class_hover;

        try {
            console.log('Starting coverage for ' + (isMobile ? 'mobile' : 'desktop') + ' version');
            const [covered_css, resultItem] = await generateCoverage(site_url_page, page_send_cov, css_id_or_class_click, css_id_or_class_hover, isMobile);
            console.log('Coverage completed for ' + (isMobile ? 'mobile' : 'desktop') + ' version');
           
            res.status(200).json({
                page_send_cov,
                status: 200,
                message: covered_css,
                resultItem: resultItem,
            });
            res.end();
        } catch (error) {
            console.error('Error during coverage: ', error);
            res.status(203).json({
                error,
            });
            res.end();
        }
    }
}

async function generateCoverage(site_url_page, page_send_cov, css_id_or_class_click, css_id_or_class_hover, isMobile) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const viewportOptions = isMobile ? { width: 360, height: 576 } : { width: 1366, height: 768 };

    await page.setViewport(viewportOptions);
    console.log('Open the URL ' + site_url_page);
    await page.goto(site_url_page);
    console.log('The URL is open ' + site_url_page);
    
    await Promise.all([
        page.coverage.startJSCoverage(),
        page.coverage.startCSSCoverage(),
    ]);
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    let resultItem = "";
    resultItem += (await performActions(page, css_id_or_class_click, 'click')).join("");
    resultItem += (await performActions(page, css_id_or_class_hover, 'hover')).join("");

    const coverageCSS = await page.coverage.stopCSSCoverage();
    await page.coverage.stopJSCoverage();
    
    const data_css = coverageCSS;
    let covered_css = '';
    for (let entry of data_css) {
        for (let text_all_css of entry.ranges) {
            covered_css += entry.text.slice(text_all_css.start, text_all_css.end) + "\n";
        }
    }

    await browser.close();
    // Оптимізація CSS коду
    // covered_css = new CleanCSS().minify(covered_css).styles;
    
    return [covered_css, resultItem];
}

async function performActions(page, css_selector, actionType) {
    const resultItem = [];
    
    if (css_selector.length === 0) return resultItem;

    const selectors = css_selector.split("/").filter(e => e !== '');

    for (const selector of selectors) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });

            if (actionType === 'click') {
                await page.click(selector);
                resultItem.push(`<p>Click on an item with selector: <strong>${selector}</strong></p>`);
                console.log(`Click on an item with selector: ${selector}`);
            } else if (actionType === 'hover') {
                const elementHandle = await page.$(selector);
                await elementHandle.hover();
                resultItem.push(`<p>Cursor pointed to element with selector: <strong>${selector}</strong></p>`);
                console.log(`Cursor pointed to element with selector: ${selector}`);
            }
        } catch (error) {
            resultItem.push(`<p>The element with selector <strong>${selector}</strong> was not found or is not available.</p>`);
            console.error(`The element with selector ${selector} was not found or is not available.`);
        }
    }

    return resultItem;
}
