import loaderUtils from "loader-utils";

enum ConvertTypeEnum {
    /**通过@rem转换 */
    REM,
    /**通过(n)px转换 */
    PX,
    /**自定义正则转换匹配符 */
    REG,
}

enum MatchRangeEnum {
    /**匹配 全部 */
    All = 'all',
    /**匹配html标签内 */
    Html = 'html',
    /**匹配style */
    Style = 'style',
    /**匹配template */
    Template = 'template',
    Vue = 'vue',
}

interface Options {
    convertType: ConvertTypeEnum,
    rootFontSize: number,
    precision: number,
    range: string,
    autoRemovePrefixZero: boolean,
}

const defaultProp: Options = {
    /**转换匹配符 */
    convertType: ConvertTypeEnum.REM,
    /**视窗宽度 */
    rootFontSize: 100,
    /**单位精度 */
    precision: 5,
    /**匹配范围 */
    range: MatchRangeEnum.Vue,
    /**自动删除小数点0. */
    autoRemovePrefixZero: true,
};

const sourceRegs: object = {
    [MatchRangeEnum.All]: /[\s\S]+/ig,
    [MatchRangeEnum.Html]: /<html[\s\S]+>[\s\S]+<\/html>/ig,
    [MatchRangeEnum.Style]: /<style[\s\S]+>[\s\S]+<\/style>/ig,
    [MatchRangeEnum.Template]: /<template>([\s\S]+)<\/template>/ig,
}

const covertTypeRegs: object = {
    [ConvertTypeEnum.REM]: /rem\(([-]?[\d.]+)\)/ig,
    [ConvertTypeEnum.PX]: /([-]?[\d.]+)px/ig,
};

const numberToFixed = (value: number, n: number):  number => {
    return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
}

const createReplace = (reg: RegExp, content: string, convertTypeReg: RegExp, options: Options) => {
    let _source = '';
    if (reg.test(content)) {
        const match = content.match(reg);
        _source = match ? match[0] : '';
    }

    if (!_source) return content;

    _source = _source.replace(convertTypeReg, ($0, $1): string => {
        if (!$1) return;
        const pixels: number = parseFloat($1);
        let value: string = numberToFixed(pixels / options.rootFontSize, options.precision).toString();

        // 自动删除0.
        if (options.autoRemovePrefixZero && value.startsWith('0.')) {
            value = value.substring(1);
        }
        return `${value}rem`;
    });

    return content.replace(reg, _source);
}

const extendsionNames = ['scss', 'sass', 'less', 'css'];

const getExtensionName = (url: string) => {
    if (!url) return '';
    const index = url.lastIndexOf('.');
    return url.substring(index + 1);
}

export default function(source: any, params?: Options): string {
    const options: object = loaderUtils.getOptions(this ? this : { query: params || {} });
    const defaults: any = Object.assign({}, defaultProp, options);

    const convertTypeReg: RegExp = covertTypeRegs[defaults.convertType];
    if (defaults.range === MatchRangeEnum.Vue) {
        let result: string = source, regs = [];
        if (this && extendsionNames.includes(getExtensionName(this.resourcePath))) {
            regs = [sourceRegs[MatchRangeEnum.All]];
        } else {
            regs = [sourceRegs[MatchRangeEnum.Template], sourceRegs[MatchRangeEnum.Style]];
        }
        regs.forEach(reg => {
            result = createReplace(reg, result, convertTypeReg, defaults);
        });
        return result;
    } else {
        const sourceReg: RegExp = sourceRegs[defaults.range];
        return createReplace(sourceReg, source, convertTypeReg, defaults);
    }
};
