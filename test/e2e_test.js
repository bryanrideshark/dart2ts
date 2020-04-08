const {expect, assert} = require('chai');
const puppeteer = require('puppeteer');
const express = require('express');

const expected_logs = [
    'INDEX> Method Works?  or not? - 96',
    'INDEX> Nicky Hayden Lives! Works?,  or not?',
    'INDEX> This is a native method, Mario',
    'INDEX> READONLY',
    'INDEX> HI',
    'INDEX> create HI',
    'INDEX> <h1>GOOD MOOOOOOOOOOOOOOOORNING DART2TS!!</h1>',
    'INDEX> Hello Dart2TS',
    'INDEX> <b>DOC!</b> : [object HTMLBodyElement]',
    'INDEX> [ciao],[ciao],[bambina]',
    'INDEX> \n',
    'INDEX> Result 0 : 17 len : 1',
    'INDEX> Result FIRST! : 17',
    'INDEX> wow! Hello world Mario',
    'INDEX> parent :undefined , undefined',
    'INDEX> hi man!',
    'INDEX> once',
    'INDEX> parent :undefined , undefined',
    'INDEX> hi man!',
    'INDEX> twice',
    'INDEX> parent :undefined , undefined',
    'INDEX> hi man!',
    'INDEX> final',
    'INDEX> parent other XXugoxx',
    'INDEX> Yo ugo',
    'INDEX> picio',
    'INDEX> parent other XXciroxx',
    'INDEX> Yo ciro',
    'INDEX> some : oth, x: 5',
    'INDEX> some',
    'INDEX> thing : ops, x: 4',
    'INDEX> thing',
    'INDEX> has : uuu, x: undefined',
    'INDEX> has',
    'INDEX> changed : ops, x: undefined',
    'INDEX> changed',
    'INDEX> A = uga : XXciroxx , undefined',
    'INDEX> U : uga : XXciroxx',
    'INDEX> CHANGED : jungle',
    'INDEX> parent other XXugo2xx',
    'INDEX> Yo ugo2',
    'INDEX> ugo2 says',
    'INDEX> parent other x',
    'INDEX> OPTIND:5',
    'INDEX> parent :withDefault , 42',
    'INDEX> NAMED ON NAMED: withDefault',
    'INDEX> parent :django , 42',
    'INDEX> NAMED ON NAMED: django',
    'INDEX> parent :ciccio , 42',
    'INDEX> NAMED ON NAMED: ciccio',
    'INDEX> bye!',
    'INDEX> start receiving',
    'INDEX> parent :ciao , 0',
    'INDEX> parent :ciao , 1',
    'INDEX> Calling equals  ==  ??',
    'INDEX> Uguali (static typed): true',
    'INDEX> Calling equals  ==  ??',
    'INDEX> Uguali (dynamic typed): true',
    'INDEX> parent :undefined , 15',
    'INDEX> SUM : 15',
    'INDEX> parent :undefined , -5',
    'INDEX> MINUS : -5',
    'INDEX> parent :undefined , -10',
    'INDEX> NEG : -10',
    'INDEX> parent :undefined , 15',
    'INDEX> SUM : 15',
    'INDEX> parent :undefined , -5',
    'INDEX> MINUS : -5',
    'INDEX> parent :undefined , -10',
    'INDEX> NEG : -10',
    'INDEX> HERE : 5',
    'INDEX> -> 5',
    'INDEX> -> 6',
    'INDEX> Duration in minutes : 690, 11:30:00.000000',
    'INDEX> We got [--a--]',
    'INDEX> We got [--b--]',
    'INDEX> Repeat iter',
    'INDEX> Then We got [--a--]',
    'INDEX> Then We got [--b--]',
    'INDEX> I = 0',
    'INDEX> I = 1',
    'INDEX> I = 2',
    'INDEX> I = 3',
    'INDEX> I = 4',
    'INDEX> I = 5',
    'INDEX> I = 6',
    'INDEX> I = 7',
    'INDEX> I = 8',
    'INDEX> I = 9',
    'INDEX> (do) I = 0',
    'INDEX> (do) I = 1',
    'INDEX> (do) I = 2',
    'INDEX> (do) I = 3',
    'INDEX> (do) I = 4',
    'INDEX> (do) I = 5',
    'INDEX> (do) I = 6',
    'INDEX> (do) I = 7',
    'INDEX> (do) I = 8',
    'INDEX> (do) I = 9',
    'INDEX> It\'s CIAO!',
    'INDEX> PI : [3]',
    'INDEX> PI : [1]',
    'INDEX> PI : [4]',
    'INDEX> PI : [1]',
    'INDEX> PI : [5]',
    'INDEX> Received : Event 0',
    'INDEX> Received : Event 1',
    'INDEX> Received : Event 2',
    'INDEX> Received : Event 3',
    'INDEX> Received : Event 4',
    'INDEX> Received : Event 5',
    'INDEX> Received : Event 6',
    'INDEX> Received : Event 7',
    'INDEX> Received : Event 8',
    'INDEX> Received : Event 9',
    'INDEX> CANCEL',
    'INDEX> finished receiving',
    'INDEX> start receiving',
    'INDEX> Received : Event 0',
    'INDEX> Received : Event 1',
    'INDEX> Received : Event 2',
    'INDEX> Received : Event 3',
    'INDEX> Received : Event 4',
    'INDEX> Received : Event 5',
    'INDEX> Received : Event 6',
    'INDEX> Received : Event 7',
    'INDEX> Received : Event 8',
    'INDEX> Received : Event 9',
    'INDEX> finished receiving',
    'INDEX> start receiving',
    'INDEX> Received : Event 0',
    'INDEX> Received : Event 1',
    'INDEX> Received : Event 2',
    'INDEX> Received : Event 3',
    'INDEX> Received : Event 4',
    'INDEX> Received : Event 5',
    'INDEX> Received : Event 6',
    'INDEX> Received : Event 7',
    'INDEX> Received : Event 8',
    'INDEX> Received : Event 9',
    'INDEX> finished receiving',
    'INDEX> start receiving',
    'INDEX> Received : Event 0',
    'INDEX> Received : Event 1',
    'INDEX> Received : Event 2',
    'INDEX> Received : Event 3',
    'INDEX> Received : Event 4',
    'INDEX> Received : Event 5',
    'INDEX> finished receiving',
    'INDEX> start receiving',
    'INDEX> Received : Event 0',
    'INDEX> Received : Event 1',
    'INDEX> Received : Event 2',
    'INDEX> Received : Event 3',
    'INDEX> Received : Event 4',
    'INDEX> Received : Event 5',
    'INDEX> finished receiving',
    'INDEX> Future works',
    'INDEX> Future works2',
    'INDEX> Num 0',
    'INDEX> Num 1',
    'INDEX> Num 2',
    'INDEX> Num 3',
    'INDEX> Num 4'
];

describe('dart2ts', function () {
    // Define global variables
    let browser;
    let page;
    let app;
    let server;

    before(async function () {

        // Simple server for serving static files
        // Simple server for serving static files
        app = express();
        app.use(express.static('../e2e_test/dist'));
        server = app.listen(9000);

        browser = await puppeteer.launch();
    });

    after(async function () {
        await browser.close();
        await server.close();
        console.log('TEST FINISHED');
    });

    describe('tests', () => {
        before(async () => {
            page = await browser.newPage();
            page.on('console', msg => {
                for (let i = 0; i < msg.args().length; ++i)
                    //console.log(`${i}: ${msg.args()[i]}`);
                    console.log(`TESTS> ${msg.text()}`);
            });
            await page.goto('http://localhost:9000/tests.html');
        });

        after(async () => {
            await page.close();
            page = null;
        });

        describe('maps', () => {
            it('has maps', async () => {
                const testMap = await page.evaluate(() => window.tests.default.test_map.testMap());
                expect(testMap).to.be.equal(3);

            });
        });

        it('works with redirecting constructors', async () => {
            const res = await page.evaluate(() => window.tests.default.test_strange.test1(31516));
            expect(res).to.be.equal(31516);
        });

        it('works with redirecting named constructors with named args', async () => {
            const res = await page.evaluate(() => window.tests.default.test_strange.test2(31516));
            expect(res).to.be.equal(31516);
        });

        it('knows how to deal with nulls', async () => {
            const reassigned = await page.evaluate(() => window.tests.default.test_strange.test3());
            expect(reassigned).to.equal('value1');
        });

        it('knows how to deal with null objects', async () => {
            const def = await page.evaluate(() => window.tests.default.test_strange.test4(null));
            expect(def).to.equal(-1);
        });

        it('knows how to deal with null objects two times', async () => {
            const def = await page.evaluate(() => window.tests.default.test_strange.test5(null));
            expect(def).to.equal(-1);
        });

        it('knows how to deal with null that aren not null', async () => {
            const def = await page.evaluate(() => window.tests.default.test_strange.test5('hi'));
            expect(def).to.equal(2);
        });

        it('knows how to deal with null objects two times2', async () => {
            const def = await page.evaluate(() => window.tests.default.test_strange.test6(null, null));
            expect(def).to.be.null;
        });

        it('knows how to deal with null objects two times3', async () => {
            const def = await page.evaluate(() => window.tests.default.test_strange.test7(null, null));
            expect(def).to.be.null;
        });

        it('resolves metadata', async () => {

            const meta = await page.evaluate(() => window.tests.default.testMetadata());

            expect(meta).to.not.be.null;
            expect(meta.annotations).to.deep.equals([{
                "library": "asset:sample_project/lib/test_anno.dart",
                "type": "MyAnnotation",
                "value": {
                    "arguments": [
                        "Yeah!"
                    ],
                    "namedArguments": {}
                }
            }]);


        });

        it('resolves metadata on props too', async () => {

            const meta = await page.evaluate(() => window.tests.default.propAnno());

            expect(meta).to.not.be.null;
            expect(meta).to.deep.equals([{
                "arguments": [
                    "onprop"
                ],
                "namedArguments": {}
            }]);


        });

        it('async await', async function () {
            this.timeout(20000);

            const testAwait = await page.evaluate(() => window.tests.default.testAsync());

            assert.isArray(testAwait);
            expect(testAwait).to.deep.equal([0, 1, 2, 3, 4]);

        });

        it('works with closures', async () => {
            const result = await page.evaluate(() => window.tests.default.test_async_closure.doAsync('Ciao', 'Pippo'));

            expect(result).to.equal("Ciao Pippo");
        });

        it('works with closures stream', async function () {
            this.timeout(3500);
            const result = await page.evaluate(() => window.tests.default.test_async_closure.testStream());

            expect(result).to.equal("Hi Jhon,Hi Jhon,Hi Jhon");
        });

        it('test cascading', async () => {
            const testCascading = await page.evaluate(() => window.tests.default.testCascading());

            assert.isObject(testCascading);
            expect(testCascading.value).equals('ciao');
            expect(testCascading.another.value).equals('Ugo');
        });

        it('test cascading2', async () => {
            const testCascading = await page.evaluate(() => window.tests.default.testCascading().func('c'));

            expect(testCascading).equals('c!');
        });

        it('test cascading3', async () => {
            const testCascading = await page.evaluate(() => {
                return window.tests.default.testCascading().func2();
            });

            expect(testCascading).equals('Hi');
        });

        it('works with init', async () => {
            const r = await page.evaluate(()=> {
                return window.tests.default.test_init.properties.x.met();
            });

            expect(r).to.equal(7);
        });

        it('try_catch', async () => {
            const x = await page.evaluate(() => {
                return {
                    t1: window.tests.default.try_catch.doSomethingBad(),
                    t1f: window.tests.default.try_catch.properties.doSomethingBadFinally,
                    t2: window.tests.default.try_catch.doSomethingBad('a'),
                    t2f: window.tests.default.try_catch.properties.doSomethingBadFinally,
                    t3: window.tests.default.try_catch.doSomethingElseNoCatch(),
                    t3f: window.tests.default.try_catch.properties.doSomethingElseNoCatchFinally,
                    t4: window.tests.default.try_catch.doSomethingElseNoCatch('a'),
                    t4f: window.tests.default.try_catch.properties.doSomethingElseNoCatchFinally
                };
            });

            expect(x.t1).equal('Null string cannot be accessed:');
            expect(x.t1f).equal(1);
            expect(x.t2).equal('1');
            expect(x.t2f).equal(2);
            expect(x.t3).equal(-2);
            expect(x.t3f).equal(1);
            expect(x.t4).equal(1);
            expect(x.t4f).equal(2);
        });

        it('unicode',async () => {
            const prop1 = await page.evaluate(() => {
                return window.tests.default.test_unicode.properties.string4
            });
            const prop3 = await page.evaluate(() => {
                return window.tests.default.test_unicode.properties.string3
            });

            expect(prop1).equal('HH \'h\' mm \'min\' ss \'s\' zzzz');
            expect(prop3).equal('\u09E6');

        });

        xit('test js anno', async () => {
            const MyClass = await page.evaluate(() => {
                return window.tests.default.test_js_anno.MyClass;
            });

            expect(MyClass.otherName).equals('hi');
        });

        xit('test refs', async () => {
            const a1 = await page.evaluate(() => {
                return window.tests.default.test_js_anno.testRefs();
            });

            expect(a1.c).equals(3);
            expect(a1.x.c).equals(2);
        });

    });

    describe('index', () => {
        let collected_logs = [];

        before(async () => {
            page = await browser.newPage();
            page.on('console', msg => {

                for (let i = 0; i < msg.args().length; ++i) {
                    //console.log(`${i}: ${msg.args()[i]}`);
                    if (msg.text().indexOf('[WDS]') >= 0) break;
                    let m = `INDEX> ${msg.text()}`;
                    collected_logs.push(m);
                    //m = m.replace('\'', '\\\'').replace('\n', '\\n');
                    //console.log(`'${m}',`);
                    //console.log(m);
                }
            });
            await page.goto('http://localhost:9000/index.html');
        });

        after(async () => {
            await page.close();
            page = null;
        });

        it('page should be rendered', async function () {
            this.timeout(40000);

            //console.log('waiting for end of work');

            await page.waitForSelector('div.endofwork', {timeout: 20000});

            let logs_snapshot = collected_logs.slice();
            expect(logs_snapshot).to.deep.equal(expected_logs);

            const createdTask = await page.evaluate(() => document.querySelector('div.endofwork').textContent);

            // Compare actual text with expected input
            //console.log('executing task');
            expect(createdTask).to.equal("finished");

            await page.screenshot({path: 'test/screens/item.png', fullscreen: true});

        });

    });


});
