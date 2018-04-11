# vue_editor
vue富文本编辑组件

使用了百度的ueditor1_4_3_3库
引用方式如下；
 <vue-ueditor @ready="editorReady" :ueditor-config="ueditorConfig" style="width: 728px; display: block; margin: 0 auto;">
 ueditorConfig 即富文本的配置参数
 editorReady  子组件富文本加载完成后触发的方法
 
 具体引用例子见popJob.html/popJob.js