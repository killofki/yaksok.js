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
		function mapPipe( F ) { return a => a .map( F ) } 
		
		function literalItems([ valueT ]) { return valueT .match( /\S+/g ) } 
		
		function literalJoiner([ joinT ]) { return ([ valueT ]) => 
			valueT .match( /\S+/g ) .join( joinT ) 
			} 
		
		function regJoins( ... regs ) { return '' .concat( ... regs .map( r => 
			r instanceof RegExp ? r .source : r 
			) ) } 
		
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
			this .$rules = valuePipe( ([ p, a ]) => mapPipe( vv => { 
					let { defaultToken, token, regex, next, ... vo } = vv 
					if ( defaultToken ) { 
						return { defaultToken } 
						} 
					let nexto = ( next ?? {} ) || { next } 
					token ?? ( [ token, regex ] = Object .entries( vo ) ) 
					
					switch( true ) { 
						case regex instanceof RegExp : 
							regex = regex .source 
							break 
						case regex instanceof Array : 
							regex = regex .join('|') 
							break 
						} 
					
					return { token, regex, ... nexto } 
					}) ( a ) ) ( new class { 
				'start' = [ 
					  new class { 'comment' = /#.*$/ } 
					, new class { 'constant.numeric' = [ r .i, r .h, r .f ] } 
					, new class { 
						'string' = /'(?=.)/ 
						next = 'qstring' 
						} 
					, new class { 
						'string' = /"(?=.)/ 
						next = 'qqstring' 
						} 
					, new class { 
						'keyword.operator' = /^\s*\*{3}\s*$/ 
						next = 'translate' 
						} 
					, new class { 'keyword.operator' = r .o } 
					, new class { 'keyword' = /약속(?=\s+그만)/ } 
					, new class { 
						'storage.type' = /약속/ 
						next =  'description' 
						} 
					, new class { 
						token = literalItems ` 
							storage.type text 
							paren.lparen text keyword text paren.rparen 
							` 
						regex = regJoins( /(번역)(\s*)(\()(\s*)/, `(${ r .id })`, /(\s*)(\))/ ) 
						next = 'description' 
						} 
					, new class { 
						token = keywordMapper 
						regex = r .id 
						} 
					, new class { 'constant.language' = /\(\s*\)/ } 
					, new class { 'paren.lparen' =  /[\(\[\{]/ } 
					, new class { 'paren.rparen' =  /[\)\]\}]/ } 
					, new class { 'text' = /\s+/ } 
					]) 
				'qstring' = [ 
					  new class { 
						'string' = /'|$/ 
						next = 'start' 
						} 
					, new class { defaultToken = 'string' } 
					] 
				'qqstring' = [ 
					  new class { 
						'string' = /"|$/ 
						next = 'start' 
						} 
					, new class { defaultToken = 'string' } 
					] 
				'description' = [ 
					  new class { 'entity.name.function' = r .id } 
					, new class { 
						'paren.lparen' = /\(/ 
						next =  'description_parameter' 
						} 
					, new class { 'paren.rparen' = /\)/ } 
					, new class { 'keyword.operator' = /\// } 
					, new class { 
						'text' = '$' 
						next = 'start' 
						} 
					, new clas { 'text' =  /\s+/ } 
					] 
				'description_parameter' = [ 
					  new class { 
						'variable.parameter' = r .id 
						next = 'description' 
						} 
					, new class { 'text' = /\s+/ } 
					] 
				'translate' = [ 
					  new class { 
						'keyword.operator' = /^\s*\*{3}/ 
						next = 'start' 
						} 
					, new class { defaultToken = 'support.function' } 
					] 
				} ) // -- this .$rules 
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
		
		let y = YaksokMode .prototype 
		let { source } = /^\s*(?:약속(?!\s+그만)|만약|반복).*$/ 
		Object .assign( YaksokMode .prototye, new class { 
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
			} // -- y .getNextLineIndent 
		// TODO: auto outdent 
		
		} // -- ( require, exports, module ) 
	) // -- ace .define 
