ace .define( 
	  'ace/mode/yaksok_highlight_rules' 
	, [ 
		  'require', 'exports', 'module' 
		, 'ace/lib/oop', 'ace/mode/text_highlight_rules' 
		] 
	, ( require, exports, module ) => { 
		
		let oop = require('../lib/oop') 
		let { TextHighlightRules } = require('./text_highlight_rules') 
		let r = valuePipe( ([ p, v ]) => [ p, v .src ] ) ( new class { 
			i = /(?:(?:[1-9]\d*)|(?:0))/
			h = /(?:0[xX][0-9a-fA-F]+)/
			f = /(?:\d*\.?\d+(?:[Ee](?:[+-]?\d+)?)?)/
			id = /(?:[$_a-zA-Z가-힣][$_a-zA-Z가-힣0-9]*)/
			o = /(?:!=|>=|<=|\.|\-|\/|[~:+*%><])/
			} ) 
		
		oop .inherits( YaksokHighlightRules, TextHighlightRules ) 
		
		exports .YaksokHighlightRules = YaksokHighlightRules 
		
		// .. functions .. 
		
		function valuePipe( F ) { return o => 
			Object .fromEntries( Object .entries( o ) .map( F ) ) 
			} 
		function mapPipe( F ) { return a => a .map( F ) } 
		
		function literalJoiner([ joinT ]) { return ([ valueT ]) => 
			valueT .match( /\S+/g ) .join( joinT ) 
			} 
		
		function YaksokHighlightRules() { 
			let keywordMapper = this .createKeywordMapper( new class { 
				'support.function' = '보여주기' 
				'constant.language.boolean' = literalJoin `|` ` 참 거짓 ` 
				'keyword' = literalJoiner `|` ` 
					약속 번역 결속 만약 반복 그만 다시 이전 
					이면 이라면 아니면 아니라면 아니면서 
					이고 그리고 또는 이거나 
					바깥 의 마다 
					` 
				}, 'identifier' ) 
			this .$rules = new class { 
				'start' = mapPipe( vv => { 
						let { token, regex, next, ... vo } = vv 
						let nexto = ( next ?? {} ) || { next } 
						token ?? ( [ token, regex ] = Object .entries( vo ) ) 
						return { token, regex, ... nexto } 
						} ) ([ 
					  new class { 'comment' = '#.*$' } 
					, new class { 'constant.numeric' = [ r .i, r .h, r .f ] .join('|') } 
					, new class { 
						'string' = '\'(?=.)' 
						next = 'qstring' 
						} 
					, new class { 
						'string' = '\"(?=.)' 
						next = 'qqstring' 
						} 
					, new class { 
						'keyword.operator' = '^\\s*\\*{3}\\s*$' 
						next = 'translate' 
						} 
					, new class { 'keyword.operator' = r .o } 
					, new class { 'keyword' = '약속(?=\\s+그만)' } 
					, new class { 
						'storage.type' = '약속' 
						next =  'description' } 
					, new class { 
						token = [ 
							'storage.type', 'text', 
							'paren.lparen', 'text', 'keyword', 'text', 'paren.rparen' 
							] 
						regex = '(번역)(\\s*)(\\()(\\s*)(' + r.id + ')(\\s*)(\\))' 
						next = 'description' 
						} 
					, new class { 
						token = keywordMapper 
						regex = r .id 
						} 
					, new class { 'constant.language' = '\\(\\s*\\)' } 
					, new class { 'paren.lparen' =  '[\\(\\[\\{]' } 
					, new class { 'paren.rparen' =  '[\\)\\]\\}]' } 
					, new class { 'text' = '\\s+' } 
					]) 
				'start' = [ 
					{ token: 'comment', regex: '#.*$' }, 
					{ token: 'constant.numeric', regex: [r.i, r.h, r.f].join('|') }, 
					{ token: 'string', regex: '\'(?=.)', next: 'qstring' }, 
					{ token: 'string', regex: '\"(?=.)', next: 'qqstring' }, 
					{ token: 'keyword.operator', regex: '^\\s*\\*{3}\\s*$', next: 'translate' }, 
					{ token: 'keyword.operator', regex: r.o }, 
					{ token: 'keyword', regex: '약속(?=\\s+그만)' }, 
					{ token: 'storage.type', regex: '약속', next: 'description' }, 
					{ 
						 token: [ 
							  'storage.type', 'text', 
							  'paren.lparen', 'text', 'keyword', 'text', 'paren.rparen' 
						 ], 
						 regex: '(번역)(\\s*)(\\()(\\s*)(' + r.id + ')(\\s*)(\\))', 
						 next: 'description' 
					}, 
					{ token: keywordMapper, regex: r.id }, 
					{ token: 'constant.language', regex: '\\(\\s*\\)' }, 
					{ token: 'paren.lparen', regex: '[\\(\\[\\{]' }, 
					{ token: 'paren.rparen', regex: '[\\)\\]\\}]' }, 
					{ token: 'text', regex: '\\s+' } 
					] 
				'qstring' = [ 
					{ token: 'string', regex: '\'|$', next: 'start' }, 
					{ defaultToken: 'string' } 
					] 
				'qqstring' = [ 
					{ token: 'string', regex: '\"|$', next: 'start' }, 
					{ defaultToken: 'string' } 
					] 
				'description' = [ 
					{ token: 'entity.name.function', regex: r.id }, 
					{ token: 'paren.lparen', regex: '\\(', next: 'description_parameter' }, 
					{ token: 'paren.rparen', regex: '\\)' }, 
					{ token: 'keyword.operator', regex: '\\/' }, 
					{ token: 'text', regex: '$', next: 'start' }, 
					{ token: 'text', regex: '\\s+' } 
					] 
				'description_parameter' = [ 
					{ token: 'variable.parameter', regex: r.id, next: 'description' }, 
					{ token: 'text', regex: '\\s+' } 
					] 
				'translate' = [ 
					{ token: 'keyword.operator', regex: '^\\s*\\*{3}', next: 'start' }, 
					{ defaultToken: 'support.function' } 
					] 
				} // -- this .$rules 
			} // -- YaksokHighlightRules() 
		} 
	) // -- ace .define 

ace .define( 
	  'ace/mode/yaksok' 
	, [ 
		  'require', 'exports', 'module' 
		, 'ace/lib/oop', 'ace/mode/text', 'ace/mode/folding/pythonic', 'ace/range' 
		] 
	, ( require, exports, module ) => { 
		
		let oop = require('../lib/oop') 
		let TextMode = require('./text') .Mode 
		let PythonFoldMode = require('./folding/pythonic').FoldMode 
		let YaksokHighlightRules = require('./yaksok_highlight_rules').YaksokHighlightRules 
		
		function YaksokMode() {} 
		oop.inherits(YaksokMode, TextMode) 
		
		let y = YaksokMode.prototype 
		y.HighlightRules = YaksokHighlightRules 
		y.foldingRules = new PythonFoldMode('^\\s*(?:약속(?!\\s+그만)|만약|반복).*$') 
		y.lineCommentStart = '#' 
		y.getNextLineIndent = function (state, line, tab) { 
			 let indent = this.$getIndent(line) 
			 let tokenizedLine = this.getTokenizer().getLineTokens(line, state) 
			 let tokens = tokenizedLine.tokens 
			 if (tokens.length && tokens[tokens.length - 1].type === 'comment') { 
				  return indent 
			 } 
			 if (state === 'start') { 
				  let match = line.match( 
						/^(?:.*[\{\(\[]\s*|\s*(?:약속|만약|반복).*)$/ 
				  ) 
				  if (match) { 
						indent += tab 
				  } 
			 } 
			 return indent 
		} 
		// TODO: auto outdent 
		
		exports.Mode = YaksokMode 
		
		} 
	) // -- ace .define 
