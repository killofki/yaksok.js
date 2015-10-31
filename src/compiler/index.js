import { NodeVisitor } from 'ast';
import parser from 'parser';
import Analyzer from 'analyzer';

export const BEFORE_ANALYZE = {};
export const AFTER_ANALYZE = {};

export default class Compiler extends NodeVisitor {
    constructor(config={}) {
        super();
        this.analyzer = new Analyzer();
        this.plugins = new CompilerPlugins();
        this.config = config;
    }
    init() {
        super.init();
        this.result = [];
        this.analyzer.translateTargets = this.translateTargets;
    }
    write(code) { this.result.push(code); }
    async prepareAstRoot(code) {
        let astRoot = parser.parse(code);
        for (let plugin of this.plugins.get(BEFORE_ANALYZE))
            await plugin.run(astRoot, this.config);
        await this.analyzer.analyze(astRoot);
        for (let plugin of this.plugins.get(AFTER_ANALYZE))
            await plugin.run(astRoot, this.config);
        return astRoot;
    }
    async compile(code) {
        this.init();
        let astRoot = await this.prepareAstRoot(code);
        await this.visit(astRoot);
        return this.result.join('');
    }
}

class CompilerPlugins {
    constructor() { this.clear(); }
    clear() { this.map = new Map(); }
    get(phase=AFTER_ANALYZE) { return this.map.has(phase)? this.map.get(phase).slice() : []; }
    add(plugins=[], phase=AFTER_ANALYZE) { this.map.set(phase, this.get(phase).concat(plugins)); }
}
