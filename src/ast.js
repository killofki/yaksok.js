export class AstNode {
    constructor() {
        this.parent = null;
    }
    replaceChild(before, after) {
        // after.parent = this;
        throw new Error('구현되지 않았습니다.');
    }
    replace(after) {
        if (this.parent === null) {
            throw new Error('부모가 없습니다.');
        }
        return this.parent.replaceChild(this, after);
    }
}

export class AstNodeList extends AstNode {
    constructor() {
        super();
        this.childNodes = [];
    }
    get length() { return this.childNodes.length; }
    push(childNode) {
        if (childNode !== null) {
            childNode.parent = this;
        }
        this.childNodes.push(childNode);
    }
    [Symbol.iterator]() {
        return this.childNodes[Symbol.iterator]();
    }
}

export class YaksokRoot extends AstNode {
    constructor(statements) {
        super();
        this.hash = null; // module resolver 패스를 거친 뒤부터 사용 가능
        this.modules = {}; // key: module name, value: module hash
                           // module resolver 패스를 거친 뒤부터 사용 가능
        this.moduleScope = null; // module resolver 패스를 거친 뒤부터 사용 가능
        this.statements = statements;
        statements.parent = this;
    }
}
// block is statements
export class Statements extends AstNodeList {
    constructor() {
        super();
        this.scope = null; // analyzer 패스를 거친 뒤부터 접근 가능
    }
}

// statement
export class Statement {
    eliminateDeadCode() { // return boolean or replacement node
        return false; // prevent elimination
    }
}
export class PlainStatement extends Statement {
    constructor(expression) {
        super();
        expression.parent = this;
        this.expression = expression;
    }
}
export class Assign extends Statement {
    constructor(lvalue, rvalue) {
        super();
        lvalue.parent = rvalue.parent = this;
        this.lvalue = lvalue;
        this.rvalue = rvalue;
        this.isDeclaration = false;
    }
}
export class Outside extends Statement {
    constructor(name) {
        super();
        name.parent = this;
        this.name = name;
    }
}
export class If extends Statement {
    constructor(condition, ifBlock, elseBlock) {
        super();
        this.condition = condition;
        this.ifBlock = ifBlock;
        this.elseBlock = elseBlock;
    }
    get condition() { return this._condition; }
    get ifBlock() { return this._ifBlock; }
    get elseBlock() { return this._elseBlock; }
    set condition(value) {
        if (value !== null) value.parent = this;
        this._condition = value;
    }
    set ifBlock(value) {
        if (value !== null) value.parent = this;
        this._ifBlock = value;
    }
    set elseBlock(value) {
        if (value !== null) value.parent = this;
        this._elseBlock = value;
    }
    eliminateDeadCode() {
        let bool = this.condition.fold();
        if (bool instanceof Boolean) {
            return bool.value? this.ifBlock : this.elseBlock;
        }
        return false;
    }
}
export class Loop extends Statement {
    constructor(block) {
        super();
        block.parent = this;
        this.block = block;
    }
}
export class Iterate extends Statement {
    constructor(iterator, iteratee, block) {
        super();
        iterator.parent = iteratee.parent = block.parent = this;
        this.iterator = iterator;
        this.iteratee = iteratee;
        this.block = block;
    }
}
export class LoopEnd extends Statement {}
export class YaksokEnd extends Statement {}

// expression
export class Expressions extends AstNodeList {}
export class Expression extends AstNode {
    get isConstant() { return false; }
    fold() { return this; }
}
Expression.prototype.type = null;

export class Call extends Expression {
    constructor(expressions) {
        super();
        expressions.parent = this;
        this.expressions = expressions; // analyzer 패스를 거친 뒤로는 무의미
        this._callInfo = null; // analyzer 패스를 거친 뒤부터 접근 가능
    }
    get callInfo() { return this._callInfo; }
    set callInfo(value) {
        value.parent = this;
        this._callInfo = value;
    }
    fold() {
        this.callInfo.args = this.callInfo.args.map(arg => arg.fold());
        // TODO: fold call
        return super.fold();
    }
}

export class ModuleCall extends Expression {
    constructor(target, expressions) {
        super();
        target.parent = expressions.parent = this;
        this.target = target;
        this.expressions = expressions; // analyzer 패스를 거친 뒤로는 무의미
        this._callInfo = null; // analyzer 패스를 거친 뒤부터 접근 가능
    }
    get callInfo() { return this._callInfo; }
    set callInfo(value) {
        value.parent = this;
        this._callInfo = value;
    }
    fold() {
        this.callInfo.args = this.callInfo.args.map(arg => arg.fold());
        // TODO: fold call
        return super.fold();
    }
}

// primitive
export class Primitive extends Expression {
    constructor(value) { super(); this.value = value; }
    get isConstant() { return true; }
}
export class Name extends Primitive {
    constructor(value) {
        super(value);
        this.call = false; // true: 식별자 하나짜리 약속일지도 모름
                           // analyzer 패스에서 사용되고 난 이후에는 의미가 없다.
    }
    get isConstant() {
        // TODO: 상수 접기 구현
        return false;
    }
}
export class String extends Primitive {} String.prototype.type = String;
export class Integer extends Primitive {} Integer.prototype.type = Integer;
export class Float extends Primitive {} Float.prototype.type = Float;
export class Boolean extends Primitive {} Boolean.prototype.type = Boolean;
export class Void extends Primitive {} Void.prototype.type = Void;

// etc
export class Range extends Expression {
    constructor(start, stop) {
        super();
        start.parent = stop.parent = this;
        this.start = start;
        this.stop = stop;
    }
}
Range.prototype.type = Range;
export class List extends Expression {
    constructor() {
        super();
        this.items = [];
    }
    push(value) {
        value.parent = this;
        this.items.push(value);
    }
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
}
List.prototype.type = List;
export class Dict extends Expression {
    constructor() {
        super();
        this.items = [];
    }
    push(value) {
        value.parent = this;
        this.items.push(value);
    }
    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
}
Dict.prototype.type = Dict;
export class DictKeyValue extends AstNode {
    constructor(key, value) {
        super();
        key.parent = value.parent = this;
        this.key = key;
        this.value = value;
    }
}

// binary opeartor
export class BinaryOperator extends Expression {
    constructor(lhs, rhs) {
        super();
        lhs.parent = rhs.parent = this;
        this.lhs = lhs;
        this.rhs = rhs;
    }
}
export class Access extends BinaryOperator {}
export class DotAccess extends BinaryOperator {}
// logical
export class Or extends BinaryOperator {}
Or.prototype.type = Boolean;
export class And extends BinaryOperator {}
And.prototype.type = Boolean;
export class Equal extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            return new Boolean(this.lhs.fold().value === this.rhs.fold().value);
        }
        return super.fold();
    }
}
Equal.prototype.type = Boolean;
export class NotEqual extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            return new Boolean(this.lhs.fold().value !== this.rhs.fold().value);
        }
        return super.fold();
    }
}
NotEqual.prototype.type = Boolean;
export class GreaterThan extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Boolean(lhs.value > rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Boolean(lhs.value > rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Boolean(lhs.value > rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Boolean(lhs.value > rhs.value);
        }
        return super.fold();
    }
}
GreaterThan.prototype.type = Boolean;
export class LessThan extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Boolean(lhs.value < rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Boolean(lhs.value < rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Boolean(lhs.value < rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Boolean(lhs.value < rhs.value);
        }
        return super.fold();
    }
}
LessThan.prototype.type = Boolean;
export class GreaterThanEqual extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Boolean(lhs.value >= rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Boolean(lhs.value >= rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Boolean(lhs.value >= rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Boolean(lhs.value >= rhs.value);
        }
        return super.fold();
    }
}
GreaterThanEqual.prototype.type = Boolean;
export class LessThanEqual extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Boolean(lhs.value <= rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Boolean(lhs.value <= rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Boolean(lhs.value <= rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Boolean(lhs.value <= rhs.value);
        }
        return super.fold();
    }
}
LessThanEqual.prototype.type = Boolean;
// arithmetical
export class Plus extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof String && rhs instanceof String)
                return new String(lhs.value + rhs.value);
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Integer(lhs.value + rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Float(lhs.value + rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Float(lhs.value + rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Float(lhs.value + rhs.value);
        }
        return super.fold();
    }
}
export class Minus extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Integer(lhs.value - rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Float(lhs.value - rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Float(lhs.value - rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Float(lhs.value - rhs.value);
        }
        return super.fold();
    }
}
export class Multiply extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Integer(lhs.value * rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Float(lhs.value * rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Float(lhs.value * rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Float(lhs.value * rhs.value);
        }
        return super.fold();
    }
}
export class Divide extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Float(lhs.value / rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Float(lhs.value / rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Float(lhs.value / rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Float(lhs.value / rhs.value);
        }
        return super.fold();
    }
}
Divide.prototype.type = Float;
export class Modular extends BinaryOperator {
    fold() {
        if (this.lhs.isConstant && this.rhs.isConstant) {
            let lhs = this.lhs.fold();
            let rhs = this.rhs.fold();
            if (lhs instanceof Integer && rhs instanceof Integer)
                return new Integer(lhs.value % rhs.value);
            if (lhs instanceof Float && rhs instanceof Integer)
                return new Float(lhs.value % rhs.value);
            if (lhs instanceof Integer && rhs instanceof Float)
                return new Float(lhs.value % rhs.value);
            if (lhs instanceof Float && rhs instanceof Float)
                return new Float(lhs.value % rhs.value);
        }
        return super.fold();
    }
}

export class CallInfo extends AstNode {
    constructor(def) {
        super();
        // def는 callInfo의 자식이 아니고,
        // 호출되는 정의를 가르키는 속성이기 때문에,
        // def의 parent를 callInfo로 설정하면 안된다.
        this.def = def;
        this.args = [];
    }
    get length() { return this.args.length; }
    push(childNode) {
        childNode.parent = this;
        this.args.push(childNode);
    }
    [Symbol.iterator]() {
        return this.args[Symbol.iterator]();
    }
}

// description
export class Description extends AstNodeList {
    match(expressions) {
        if (expressions.length > this.length) return null;
        let callInfo = new CallInfo(this.parent);
        for (let [i, j] = [0, 0]; i < this.length; ++i, ++j) {
            let curr = this.childNodes[i];
            let expression = expressions.childNodes[j];
            if (curr instanceof DescriptionName) {
                if (curr.match(expression)) continue;
                return null;
            }
            if (curr instanceof DescriptionParameter) {
                if (!(expression instanceof Name)) {
                    callInfo.push(expression);
                    continue;
                }
                let next = this.childNodes[i + 1];
                let nextExpression = expressions.childNodes[j + 1];
                if (!next || next.match(nextExpression) || next.needWhiteSpace) {
                    callInfo.push(expression);
                    continue;
                }
                let matchLength = next.postMatch(expression);
                let name = expression.value;
                if (matchLength && name.length > matchLength) {
                    ++i;
                    callInfo.push(new Name(name.substr(0, name.length - matchLength)));
                    continue;
                }
                if (!nextExpression) return null;
                callInfo.push(expression);
                continue;
            }
            throw new Error('unexpected description item');
        }
        return callInfo;
    }
    get parameters() {
        return this.childNodes.filter(item => item instanceof DescriptionParameter);
    }
    get repr() { return this.childNodes.map(expression => expression.repr).join(''); }
}
export class DescriptionParameter extends AstNode {
    constructor(value) { super(); this.value = value; }
    get repr() { return `(${ this.value })`; }
}
export class DescriptionName extends AstNode {
    constructor() {
        super();
        this.names = [];
    }
    needWhiteSpace = false;
    match(name) {
        if (!(name instanceof Name)) return false;
        return this.names.some(potential => name.value === potential);
    }
    postMatch(param) {
        if (!(param instanceof Name)) return 0;
        let match = this.names.find(potential => param.value.endsWith(potential));
        return match ? match.length : 0;
    }
    get length() { return this.names.length; }
    push(name) {
        // name: string
        this.names.push(name);
    }
    sort() { this.names.sort((a, b) => b.length - a.length); }
    [Symbol.iterator]() {
        return this.names[Symbol.iterator]();
    }
    get repr() { return (this.needWhiteSpace ? ' ' : '') + this.names.join('/'); }
}

// defs
export class Def extends Statement {
    constructor() {
        super();
        this.scope = null;
        this.returnType = null;
    }
    match(call) { // return call info or null
        return this.description.match(call.expressions);
    }
    get hasSideEffect() { return true; }
    get repr() {
        return `정의 ${ this.description.repr }`;
    }
}

export class Yaksok extends Def {
    constructor(description, block) {
        super();
        description.parent = block.parent = this;
        this.description = description;
        this.block = block;
    }
    get hasSideEffect() {
        // TODO: 현재 약속의 부수효과 여부 반환
        return super.hasSideEffect();
    }
    get repr() {
        return `약속 ${ this.description.repr }`;
    }
}

export class Translate extends Def {
    constructor(description, target, code) {
        super();
        description.parent = this;
        this.description = description;
        this.target = target; // string
        this.code = code; // string
    }
    get repr() {
        return `번역(${ this.target }) ${ this.description.repr }`;
    }
}

export class NodeVisitor {
    constructor() {
        this.translateTargets = [];
    }
    async init() {}
    async visit(node) {
        if (node instanceof YaksokRoot) return await this.visitYaksokRoot(node);
        if (node instanceof Statements) return await this.visitStatements(node);
        if (node instanceof Statement) return await this.visitStatement(node);
        if (node instanceof Expressions) return await this.visitExpressions(node);
        if (node instanceof Expression) return await this.visitExpression(node);
        if (node instanceof Description) return await this.visitDescription(node);
        if (node instanceof DescriptionParameter) return await this.visitDescriptionParameter(node);
        if (node instanceof DescriptionName) return await this.visitDescriptionName(node);
        throw new Error('unknown node type');
    }
    async visitYaksokRoot(node) { await this.visitStatements(node.statements); }
    async visitStatements(node) { for (let statement of node) await this.visitStatement(statement); }
    async visitStatement(node) {
        if (node instanceof PlainStatement) return await this.visitPlainStatement(node);
        if (node instanceof Assign) return await this.visitAssign(node);
        if (node instanceof Outside) return await this.visitOutside(node);
        if (node instanceof If) return await this.visitIf(node);
        if (node instanceof Loop) return await this.visitLoop(node);
        if (node instanceof Iterate) return await this.visitIterate(node);
        if (node instanceof LoopEnd) return await this.visitLoopEnd(node);
        if (node instanceof YaksokEnd) return await this.visitYaksokEnd(node);
        if (node instanceof Def) return await this.visitDef(node);
        throw new Error('unknown node type');
    }
    async visitPlainStatement(node) { await this.visitExpression(node.expression); }
    async visitAssign(node) {
        await this.visit(node.rvalue); // attention: evaluation order
        await this.visit(node.lvalue);
    }
    async visitOutside(node) {
        await this.visit(node.name);
    }
    async visitCall(node) {}
    async visitModuleCall(node) {}
    async visitIf(node) {
        await this.visit(node.condition);
        await this.visitStatements(node.ifBlock);
        if (node.elseBlock) {
            await this.visitStatements(node.elseBlock);
        }
    }
    async visitLoop(node) { await this.visit(node.block); }
    async visitIterate(node) {
        await this.visit(node.iteratee);
        await this.visit(node.iterator);
        await this.visit(node.block);
    }
    async visitLoopEnd(node) {}
    async visitYaksokEnd(node) {}
    async visitExpressions(node) { for (let expression of node) await this.visitExpression(expression); }
    async visitExpression(node) {
        if (node instanceof Call) return await this.visitCall(node);
        if (node instanceof ModuleCall) return await this.visitModuleCall(node);
        if (node instanceof Primitive) return await this.visitPrimitive(node);
        if (node instanceof Range) return await this.visitRange(node);
        if (node instanceof List) return await this.visitList(node);
        if (node instanceof Dict) return await this.visitDict(node);
        if (node instanceof BinaryOperator) return await this.visitBinaryOperator(node);
        throw new Error('unknown node type');
    }
    async visitPrimitive(node) {
        if (node instanceof Name) return await this.visitName(node);
        if (node instanceof String) return await this.visitString(node);
        if (node instanceof Integer) return await this.visitInteger(node);
        if (node instanceof Float) return await this.visitFloat(node);
        if (node instanceof Boolean) return await this.visitBoolean(node);
        if (node instanceof Void) return await this.visitVoid(node);
        throw new Error('unknown node type');
    }
    async visitName(node) {}
    async visitString(node) {}
    async visitInteger(node) {}
    async visitFloat(node) {}
    async visitBoolean(node) {}
    async visitVoid(node) {}
    async visitRange(node) {
        await this.visit(node.start);
        await this.visit(node.stop);
    }
    async visitList(node) { for (let item of node) await this.visitExpression(item); }
    async visitDict(node) { for (let item of node) await this.visitDictKeyValue(item); }
    async visitDictKeyValue(node) {
        await this.visitName(node.key);
        await this.visitExpression(node.value);
    }
    async visitBinaryOperator(node) {
        if (node instanceof Access) return await this.visitAccess(node);
        if (node instanceof DotAccess) return await this.visitDotAccess(node);
        if (node instanceof Or) return await this.visitOr(node);
        if (node instanceof And) return await this.visitAnd(node);
        if (node instanceof Equal) return await this.visitEqual(node);
        if (node instanceof NotEqual) return await this.visitNotEqual(node);
        if (node instanceof GreaterThan) return await this.visitGreaterThan(node);
        if (node instanceof LessThan) return await this.visitLessThan(node);
        if (node instanceof GreaterThanEqual) return await this.visitGreaterThanEqual(node);
        if (node instanceof LessThanEqual) return await this.visitLessThanEqual(node);
        if (node instanceof Plus) return await this.visitPlus(node);
        if (node instanceof Minus) return await this.visitMinus(node);
        if (node instanceof Multiply) return await this.visitMultiply(node);
        if (node instanceof Divide) return await this.visitDivide(node);
        if (node instanceof Modular) return await this.visitModular(node);
        throw new Error('unknown node type');
    }
    async visitAccess(node) { await visitOperator.call(this, node); }
    async visitDotAccess(node) { await visitOperator.call(this, node); }
    async visitOr(node) { await visitOperator.call(this, node); }
    async visitAnd(node) { await visitOperator.call(this, node); }
    async visitEqual(node) { await visitOperator.call(this, node); }
    async visitNotEqual(node) { await visitOperator.call(this, node); }
    async visitGreaterThan(node) { await visitOperator.call(this, node); }
    async visitLessThan(node) { await visitOperator.call(this, node); }
    async visitGreaterThanEqual(node) { await visitOperator.call(this, node); }
    async visitLessThanEqual(node) { await visitOperator.call(this, node); }
    async visitPlus(node) { await visitOperator.call(this, node); }
    async visitMinus(node) { await visitOperator.call(this, node); }
    async visitMultiply(node) { await visitOperator.call(this, node); }
    async visitDivide(node) { await visitOperator.call(this, node); }
    async visitModular(node) { await visitOperator.call(this, node); }
    async visitDescription(node) {}
    async visitDescriptionParameter(node) {}
    async visitDescriptionName(node) {}
    async visitDef(node) {
        if (node instanceof Yaksok) return await this.visitYaksok(node);
        if (node instanceof Translate) return await this.visitTranslate(node);
        throw new Error('unknown node type');
    }
    async visitYaksok(node) {}
    async visitTranslate(node) {}
}

async function visitOperator(node) {
    await this.visit(node.lhs);
    await this.visit(node.rhs);
}
