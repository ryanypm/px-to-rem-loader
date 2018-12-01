const pxtorem = require('./lib/bundle.js');

const testString = `<template>
    <div>
        <div style="width: rem(20)" class="main-container"></div>
    </div>
</template>

<script>
export default {
    width: rem(20)
}
</script>

<style lang="scss" scoped>
    .main-container {
        line-height: rem(63.999975);
        border-radius: rem(40);
    }
</style>`;

const source = pxtorem(testString);
console.log("source= ", source);
