define(['lib/vue2.0/vue'], function(Vue) {
	var VueUEditor = Vue.extend({
		name: 'VueUEditor',
		props: {
			ueditorPath: {
				// UEditor 代码的路径
				type: String,
				default: '/js/lib/vue-ueditor/ueditor1_4_3_3/'
			},
			ueditorConfig: {
				// UEditor 配置项
				type: Object,
				default: function () {
					return {};
				}
			}
		},

		template: '<script :id="randomId" name="content" type="text/plain"></script>',

		data: function () {
			return {
				// 为了避免麻烦，每个编辑器实例都用不同的 id
				randomId: 'editor_' + (Math.random() * 100000000000000000),
				instance: null,
				// scriptTagStatus -> 0:代码未加载，1:两个代码依赖加载了一个，2:两个代码依赖都已经加载完成
				scriptTagStatus: 0
			};
		},

		created: function () {
			var vm = this;

			if (window.UE !== undefined) {
				// 如果全局对象存在，说明编辑器代码已经初始化完成，直接加载编辑器
				vm.scriptTagStatus = 2;
				vm.initEditor();
			} else {
				// 如果全局对象不存在，说明编辑器代码还没有加载完成，需要加载编辑器代码
				vm.insertScriptTag();
			}
		},

		beforeDestroy: function () {
			var vm = this;

			// 组件销毁的时候，要销毁 UEditor 实例
			if (vm.instance !== null && vm.instance.destroy) {
				vm.instance.destroy();
			}
		},

		methods: {
			insertScriptTag: function () {
				var vm = this,
					editorScriptTag = document.getElementById('editorScriptTag'),
					configScriptTag = document.getElementById('configScriptTag'),
					oFrag = document.createDocumentFragment();


				// 如果这个tag不存在，则生成相关代码tag以加载代码
				if (editorScriptTag === null) {
					/* 创建默认配置文件 */
					configScriptTag = document.createElement('script');
					configScriptTag.type = 'text/javascript';
					configScriptTag.src = vm.ueditorPath + 'ueditor.config.js';
					configScriptTag.id = 'configScriptTag';
					oFrag.appendChild(configScriptTag);

					/* 创建ueditor核心文件 */
					editorScriptTag = document.createElement('script');
					editorScriptTag.type = 'text/javascript';
					editorScriptTag.src = vm.ueditorPath + 'ueditor.all.min.js';
					editorScriptTag.id = 'editorScriptTag';
					oFrag.appendChild(editorScriptTag);

					document.getElementsByTagName('head')[0].appendChild(oFrag);
				}

				// 等待代码加载完成后初始化编辑器
				if (configScriptTag.loaded) {
					vm.scriptTagStatus++;
				} else {
					configScriptTag.addEventListener('load', function() {
						vm.scriptTagStatus++;
						configScriptTag.loaded = true;
						vm.initEditor();
					});
				}

				if (editorScriptTag.loaded) {
					vm.scriptTagStatus++;
				} else {
					editorScriptTag.addEventListener('load', function() {
						vm.scriptTagStatus++;
						editorScriptTag.loaded = true;
						vm.initEditor();
					});
				}

				vm.initEditor();
			},

			initEditor: function () {
				var vm = this;

				// scriptTagStatus 为 2 的时候，说明两个必需引入的 js 文件都已经被引入，且加载完成
				if (vm.scriptTagStatus === 2 && vm.instance === null) {
					// Vue 异步执行 DOM 更新，这样一来代码执行到这里的时候可能 template 里面的 script 标签还没真正创建
					// 所以，我们只能在 nextTick 里面初始化 UEditor
					vm.$nextTick(function() {
						vm.instance = window.UE.getEditor(vm.randomId, vm.ueditorConfig);
						// 绑定事件，当 UEditor 初始化完成后，将编辑器实例通过自定义的 ready 事件交出去
						vm.instance.addListener('ready', function() {
							vm.$emit('ready', vm.instance);
						});
					});
				}
			}
		}
	});

	return VueUEditor;
});
