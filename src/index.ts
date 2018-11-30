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
    /**匹配 style 和 template */
    All = 'all',
    /**匹配html标签内 */
    Html = 'html',
    /**匹配style */
    Style = 'style',
    /**匹配template */
    Template = 'template',
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
    range: MatchRangeEnum.All,
    /**自动删除小数点0. */
    autoRemovePrefixZero: true,
};

const sourceRegs: object = {
    [MatchRangeEnum.All]: /<template>([\s\S]+)<\/template>|<style([\s\S]+)?>[\s\S]+<\/style>/ig,
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

export default function(source: any): string {
    const options: object = loaderUtils.getOptions(this ? this : { query: {} });
    const defaults: any = Object.assign({}, defaultProp, options);

    let _source: string = '';
    const sourceReg: RegExp = sourceRegs[defaults.range];
    // 先判断是否存在符合条件的项
    if (sourceReg.test(source)) {
        // _source = sourceReg.exec(source).input;
        const match = source.match(sourceReg);
        _source = match ? match.join('') : '';
    }

    const convertTypeReg: RegExp = covertTypeRegs[defaults.convertType];
    if (convertTypeReg.test(_source)) {
        _source = _source.replace(convertTypeReg, ($0, $1): string => {
            if (!$1) return;
            const pixels: number = parseFloat($1);
            let value: string = numberToFixed(pixels / defaults.rootFontSize, defaults.precision).toString();

            // 自动删除0.
            if (defaults.autoRemovePrefixZero && value.startsWith('0.')) {
                value = value.substring(1);
            }
            return `${value}rem`;
        });
        return source.replace(sourceReg, _source);
    }

    return source;
};
