ace .define( 
	  'ace/mode/yaksok_highlight_rules', [ 
		  'require', 'exports', 'module' 
		, 'ace/lib/oop', 'ace/mode/text_highlight_rules' 
		] 
	, ( require, exports, module ) => { 
		
		let oop = require('../lib/oop') 
		let { TextHighlightRules } = require('./text_highlight_rules') 
		let r = valuePipe( ([ p, { source } ]) => [ p, source ] ) ( new class { 
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
		
		function YaksokHighlightRules() { 
			let literalItems = ([ valueT ]) => valueT .match( /\S+/g ) 
			let literalJoiner = ([ joinT ]) => ([ valueT ]) => 
				valueT .match( /\S+/g ) .join( joinT ) 
			let regJoins = ( ... regs ) => '' .concat( ... regs .map( r => 
				r instanceof RegExp ? r .source : r 
				) ) 
			let keywordMapper = this .createKeywordMapper( new class { 
				'support.function' = '보여주기' 
				'constant.language.boolean' = literalJoiner `|` ` 참 거짓 ` 
				'keyword' = literalJoiner `|` ` 
					약속 번역 결속 만약 반복 그만 다시 이전 
					이면 이라면 아니면 아니라면 아니면서 
					이고 그리고 또는 이거나 
					바깥 의 마다 
					` 
				}, 'identifier' ) 
			
			let tokenPicker = vv => { 
				let { defaultToken, token, regex, next, ... vo } = vv 
				if ( defaultToken ) { 
					return { defaultToken } // or return vv ..? 
					} 
				
				let nexto = ( next ?? {} ) || { next } 
				token ?? ( [ token, regex ] = Object .entries( vo ) ) 
				switch( true ) { // source || array join 
					case regex instanceof RegExp : 
						regex = regex .source 
						break 
					case regex instanceof Array : 
						regex = regex .join('|') 
						break 
					} 
				
				return { token, regex, ... nexto } 
				} 
			let tokenRegs = a => a .map( tokenPicker ) 
			
			let start = tokenRegs([ 
				  { 'comment' : /#.*$/ } 
				, { 'constant.numeric' : [ r .i, r .h, r .f ] } 
				, { 'string' : /'(?=.)/, next : 'qstring' } 
				, { 'string' : /"(?=.)/, next : 'qqstring' } 
				, { 'keyword.operator' : /^\s*\*{3}\s*$/, next : 'translate' } 
				, { 'keyword.operator' : r .o } 
				, { 'keyword' : /약속(?=\s+그만)/ } 
				, { 'storage.type' : /약속/, next : 'description' } 
				, { token : literalItems ` 
						storage.type text 
						paren.lparen text keyword text paren.rparen 
						` 
					, regex : regJoins( /(번역)(\s*)(\()(\s*)/, `(${ r .id })`, /(\s*)(\))/ ) 
					, next : 'description' 
					} 
				, { token : keywordMapper, regex = r .id } 
				, { 'constant.language' : /\(\s*\)/ } 
				, { 'paren.lparen' : /[\(\[\{]/ } 
				, { 'paren.rparen' : /[\)\]\}]/ } 
				, { 'text' : /\s+/ } 
				]) 
			let qstring = tokenRegs([ 
				  { 'string' : /'|$/, next = 'start' } 
				, { defaultToken : 'string' } 
				]) 
			let qqstring = tokenRegs([ 
				  { 'string' : /"|$/, next : 'start' } 
				, { defaultToken : 'string' } 
				]) 
			let description = tokenRegs([ 
				  { 'entity.name.function' : r .id } 
				, { 'paren.lparen' : /\(/, next =  'description_parameter' } 
				, { 'paren.rparen' : /\)/ } 
				, { 'keyword.operator' : /\// } 
				, { 'text' : '$', next : 'start' } 
				, { 'text' :  /\s+/ } 
				]) 
			let description_parameter = tokenRegs([ 
				  { 'variable.parameter' : r .id, next : 'description' } 
				, { 'text' : /\s+/ } 
				]) 
			let translate = tokenRegs([ 
				  { 'keyword.operator' : /^\s*\*{3}/, next : 'start' } 
				, { defaultToken : 'support.function' } 
				])  
			
			this .$rules = { 
				  start, qstring, qqstring 
				, description, description_parameter 
				, translate 
				} 
			} // -- YaksokHighlightRules() 
		} // -- ( require, exports, module ) 
	) // -- ace .define 

ace .define( 
	  'ace/mode/yaksok', [ 
		  'require', 'exports', 'module' 
		, 'ace/lib/oop', 'ace/mode/text', 'ace/mode/folding/pythonic', 'ace/range' 
		] 
	, ( require, exports, module ) => { 
		
		let oop = require('../lib/oop') 
		let { Mode } = require('./text') 
		let { FoldMode } = require('./folding/pythonic') 
		let { YaksokHighlightRules } = require('./yaksok_highlight_rules') 
		
		function YaksokMode() {} 
		oop .inherits( YaksokMode, Mode ) 
		
		let { source } = /^\s*(?:약속(?!\s+그만)|만약|반복).*$/ 
		Object .assign( YaksokMode .prototype, new class { 
			HighlightRules = YaksokHighlightRules 
			foldingRules = new FoldMode( source ) 
			lineCommentStart = '#' 
			getNextLineIndent = getNextLineIndent 
			} ) 
		
		exports .Mode = YaksokMode 
		
		// .. functions .. 
		
		function getNextLineIndent( state, line, tab ) { 
			let indent = this .$getIndent( line ) 
			let tokenizedLine = this .getTokenizer() .getLineTokens( line, state ) 
			let tokens = tokenizedLine .tokens 
			if ( 
					   tokens .length 
					&& tokens[ tokens .length - 1 ] .type === 'comment' 
					) { 
				return indent 
				} 
			if ( state === 'start' ) { 
				let match = line .match( 
					/^(?:.*[\{\(\[]\s*|\s*(?:약속|만약|반복).*)$/ 
					) 
				if ( match ) { 
					indent += tab 
					} 
				} 
			return indent 
			} // -- getNextLineIndent() 
		// TODO: auto outdent 
		
		} // -- ( require, exports, module ) 
	) // -- ace .define 
