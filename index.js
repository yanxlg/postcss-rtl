const postcss = require('postcss');
const index = require('rtlcss');

module.exports = postcss.plugin('postcss-plugin-rtl', opts => {
    const {exclude, include} = opts || {};
    return root => {
        const file = root.source.input.file;
        if (exclude && exclude.test(file) || include && !include.test(file)) {
            return ;
        }

        let extraRulesList = [];

        root.walkRules(rule => {
            if(rule.parent.type==="atrule"){
                return;
            }
            const css = rule.toString();
            const parseCss = index.process(css, {
                useCalc: true,
            });
            const prevNode = postcss.parse(css);
            // sass中可能会出现最后不是以;结束的，rtlcss会不识别最后一个属性上的的指令




            const nextNode = postcss.parse(parseCss);
            const selector = rule.selector;
            const rtlRule = postcss.rule({ selector: "[dir='rtl'] " + selector});
            const ltrRule = postcss.rule({ selector: "[dir='ltr'] " + selector});
            let removeList = [];
            // 可能不止一个nodes
            for (let i = 0 ; i < prevNode.nodes.length; i++) {
                let cur = prevNode.nodes[i].nodes[0]; // 初始值
                let _cur = nextNode.nodes[i].nodes[0];
                // 游标遍历
                while (cur) {
                    if (cur.type === "decl") {
                        while ( _cur.type !== "decl") {
                            _cur = _cur.next();
                        }
                        // compare
                        if (cur.prop !== _cur.prop || cur.value !== _cur.value) {
                            ltrRule.append({
                                prop: cur.prop,
                                value: cur.value,
                            });
                            rtlRule.append({
                                prop: _cur.prop,
                                value: _cur.value,
                            });
                            removeList.push(cur);
                        }
                        _cur = _cur.next();
                    }
                    cur = cur.next();
                }
            }
            removeList.map((decl) => decl.remove());
            extraRulesList.push(rtlRule);
            extraRulesList.push(ltrRule);
            // 转成Node后进行比较
            rule.replaceWith(prevNode);
        });
        root.append(extraRulesList);
    };
});
