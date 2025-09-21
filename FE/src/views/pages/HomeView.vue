<script setup>
import {
    NSpace,
    NCard
}                       from    'naive-ui'
</script>


<template>
<NSpace vertical class="w-full min-h-screen p-4">
    <NSpace vertical class="lg:px-16 px-4">
        <h1 class="text-3xl my-4 uppercase font-semibold">Các hoạt động nổi bật</h1>
        <div class="grid lg:grid-cols-5 grid-cols-2 lg:gap-4 gap-2">
            <n-card title="Card with Cover">
                <template #cover>
                <img class="w-full lg:h-64 h-40 object-cover" src="/imgs/vn-poster1.png">
                </template>
                Card Content
            </n-card>
            <n-card title="Card with Cover">
                <template #cover>
                <img class="w-full lg:h-64 h-40 object-cover" src="/imgs/vn-poster1.png">
                </template>
                Card Content
            </n-card>
            <n-card title="Card with Cover">
                <template #cover>
                <img class="w-full lg:h-64 h-40 object-cover" src="/imgs/vn-poster1.png">
                </template>
                Card Content
            </n-card>
            <n-card title="Card with Cover">
                <template #cover>
                <img class="w-full lg:h-64 h-40 object-cover" src="/imgs/vn-poster1.png">
                </template>
                Card Content
            </n-card>
              <n-card title="Card with Cover">
                <template #cover>
                <img class="w-full lg:h-64 h-40 object-cover" src="/imgs/vn-poster1.png">
                </template>
                Card Content
            </n-card>
        </div>
    </NSpace>
</NSpace>
</template>

<style scoped>

</style>