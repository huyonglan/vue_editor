/* =============================================================================
#     FileName: popJob.js
#         Desc: 新增或编辑新闻   
#      Creator: Ryu
#   LastChange: 2017-12-13 14:23:37
============================================================================= */
require(['../../rConfig/rConfig'], function() {
    require([
        'lib/vue2.0/vue',
        'jquery',
        'lib/seelight/iframeBox',
        'lib/seelight/basicUrl',
        'lib/utils/regExp',
        'lib/vue-ueditor/UEditor',
        'lib/laydate/laydate',
        'lib/jquery.form/jquery.form'
    ], function(Vue, $, iframeBox, basicUrl, regExp, VueUEditor) {

        /* 注册分页组件 */
        Vue.component('vue-ueditor', VueUEditor);

        var main = {
            curBox: null,
            www: '',
            path: basicUrl.url,
            api: {
                /* 添加作业 */
                addJob: function(){
                    var t = main,
                        url = t.www + t.path + basicUrl.addJob;

                    return url;
                },

                /* 更新作业 */
                updateJob: function(){
                    var t = main,
                        url = t.www + t.path + basicUrl.updateJob;

                    return url;
                },

                /* 作业详情 */
                findJobById: function(){
                    var t = main,
                        url = t.www + t.path + basicUrl.findJobById;

                    return url; 
                },

                /* 下载作业附件 */
                downloadJobFile: function() {
                    var t = main,
                        url = t.www + t.path + basicUrl.downloadJobFile;

                    return url; 
                }
            },

            /*初始化*/
            init: function(){
                var t = this,
                    originData = {},
                    popAlert,
                    onlyRead,
                    isEdit,
                    item,
                    box;

                iframeBox.init(function(curBox){
                    /*获取弹窗*/
                    t.curBox = curBox;

                    if(t.curBox && t.curBox.data){
                        originData = t.curBox.data;
                    }

                    popAlert = originData.popAlert; 
                    box = originData.box;
                    isEdit = !!originData.isEdit;
                    item = originData.item || {};
                    /* onlyRead = !!originData.onlyRead; */
                    onlyRead = true;

                    /* 只有未下达的能修改 */
                    if((item && item.status == 1) || typeof item.status === 'undefined'){
                        onlyRead = false;
                    }

                    var vm = new Vue({
                        el: '#pop_job',
                        data: {
                            ueditorConfig: {
                                /* 工具栏上的所有的功能按钮和下拉框，可以在new编辑器的实例时选择自己需要的重新定义 */
                                toolbars: [[
                                    'fontsize', '|',
                                    'bold', 'italic', 'underline', 'forecolor', 'backcolor'
                                ]],
                                initialFrameWidth: 728,
                                initialFrameHeight: 240,
                                readonly : onlyRead,
                                enableAutoSave: false, 
                                saveInterval: 99999, 
                                maximumWords: 1000,
                                /* 删除元素路径 */
                                elementPathEnabled: false,
                                autoHeightEnabled: false
                            },

                            /* 是否只读 */
                            onlyRead: onlyRead,

                            /* 富文本对象 */
                            editorInstance: null,

                            /* 作业名称 */
                            jobName: '',
                            /* 截止时间 */
                            deadline: '',
                            /* 内容 */
                            content: '',

                            /* 文件名 */
                            fileName: '',

                            /* 评价标准 */
                            jobBench: {
                                benchName: '',
                                benchId: ''
                            },

                            /* 目标学生 */
                            targetGroup: {
                                fullPaths: [],
                                ids: []
                            },

                            /* 知识点 */
                            points: {
                                fullPaths: [],
                                ids: [],
                                idAndPaths: []
                            },

                            /* 是否是修改 */
                            isEdit: isEdit
                        },

                        computed: {
                            /* 知识点路径 */
                            pointFullPaths: function(){
                                var vm = this;

                                if(Object.prototype.toString.call(vm.points.fullPaths) === '[object Array]'){
                                    return vm.points.fullPaths.join(';');
                                }

                                return vm.points.fullPaths;
                            },

                            pointIdAndFullpaths: function(){
                                var vm = this;

                                return vm.points.idAndPaths.join(',');
                            },

                            /* 评价标准名称 */
                            jobStandard: function() {
                                return this.jobBench.benchName;
                            },

                            /* 目标用户，目标组 */
                            groupFullPaths: function(){
                                return this.targetGroup.fullPaths.join(';');
                            },

                            /* 是否可以上传附件 */
                            canUpFile: function() {
                                return !this.onlyRead;
                            },

                            /* 只有未下达和新建的能修改 */
                            canEdit: function() {
                                if((item && item.status == 1) || typeof item.status === 'undefined'){
                                    return true;
                                } 

                                return false;
                            },

                            /* 附件下载 */
                            downURL: function() {
                                var vm = this,
                                    url = main.api.downloadJobFile();

                                url += '?jobId=' + item.id + '&fileName=' + vm.fileName;

                                return url;
                            },

                            /* 判断是否有附件 */
                            hasFile: function() {
                                var vm = this;

                                return (item.id && vm.fileName !== '' ) ? true : false;
                            }
                        },

                        methods: {
                            /*关闭窗口*/
                            closeBox: function(){
                                t.curBox.close();
                            },

                            /*显示时间控件*/
                            pickTime: function(elName){
                                var vm = this,
                                    d = new Date(),
                                    /* 加一天 */
                                    minTime = Math.round(new Date().getTime() / 1000) + 86400,
                                    minDate = new Date(minTime * 1000).toLocaleString().split(/\s+/)[0];

                                /* 日期选择控件 */
                                laydate({
                                    elem: vm.$refs[elName],
                                    istime: false,
                                    min: minDate,
                                    format: 'YYYY-MM-DD',
                                    choose: function(datas){
                                        vm.deadline = '' + datas;
                                    }
                                });
                            },

                            /* 编辑器初始化完成 */
                            editorReady: function(editorInstance) {
                                var vm = this,
                                    timer;

                                if(editorInstance){
                                    vm.editorInstance = editorInstance;

                                    editorInstance.addListener('contentChange', function() {
                                        vm.content = editorInstance.getContent();
                                    });

                                    /* 修改 */
                                    if(vm.isEdit){
                                        vm.findJobById(item.id, function(data) {
                                            var points = {
                                                    fullPaths: [],
                                                    ids: [],
                                                    idAndPaths: []
                                                },
                                                jobPointLevels = data.jobPointLevels || [];

                                            for(var i = 0, len = jobPointLevels.length; i < len; i++) {
                                                var tmp = jobPointLevels[i];

                                                points.fullPaths.push(tmp.fullPath);
                                                points.ids.push(tmp.pointLevelId);
                                                points.idAndPaths.push([tmp.pointLevelId, tmp.fullPath].join('-'));
                                            }

                                            /* 格式化目标学生 */
                                            var targetGroup = vm.formatOrderUsers(data.orderUsers || '');

                                            vm.targetGroup = targetGroup;

                                            /* 重新赋值 */
                                            vm.jobName = data.name || item.name || '';
                                            vm.deadline = data.endTime || '';
                                            vm.content = data.detail || '';
                                            vm.points = points;
                                            vm.fileName = data.fileName || '';

                                            /* 评价标准 */
                                            vm.jobBench = {
                                                benchName: data.benchName,
                                                benchId: data.benchId
                                            };

                                            /* 设置富文本框 */
                                            editorInstance.setContent(vm.content);
                                        });
                                    }
                                }
                            },

                            formatOrderUsers: function(orderUsers) {
                                var ids = [],
                                    fullPaths = [];

                                orderUsers = orderUsers.replace(/;$/, '');

                                if(orderUsers !== '') {
                                    orderUsers = orderUsers.split(';');

                                    for(var i = 0, len = orderUsers.length; i < len; i++) {
                                        var item = orderUsers[i];
                                        var group = item.split('-');

                                        ids.push(group[0]);
                                        fullPaths.push(group[1]);
                                    }
                                }

                                return {
                                    ids: ids,
                                    fullPaths: fullPaths
                                };
                            },

                            /* 文件浏览处理 */
                            changeFile: function(fileId, mine){
                                var vm = this,
                                    dc = document,
                                    el = vm.$refs[fileId],
                                    showEl = vm.$refs['show_' + fileId],
                                    mineReg,
                                    re,
                                    file = {
                                        name: '',
                                        ext: ''
                                    };

                                /* 类型判断 */
                                if(mine) {
                                    mine = mine || 'doc,docx,pdf,rar,zip';
                                    mine = mine.split(',');
                                    mineReg = mine.join('|');
                                    re = new RegExp(mineReg, "gi");

                                    if(!el.files[0]){
                                        /* 重置上传 */
                                        el.value = '';
                                        return;
                                    }
                                }

                                /* 文件名 */
                                file.name = el.files[0].name;
                                /* 后缀名 */
                                file.ext = file.name.replace(/.*\.(.*)$/, "$1");

                                /* 判断格式 */
                                if(mine){
                                    if(!re.test(el.value)){
                                        popAlert('仅支持上传 ' + mine + ' 格式文件');

                                        /* 重置上传 */
                                        el.value = '';
                                        return;
                                    }
                                }

                                /* 显示文件名称 */
                                vm.fileName = file.name;
                            },

                            /* 知识点选择 */
                            knowlegeSelect: function(item){
                                var vm = this;

                                clearTimeout(vm.knowlegeSelect.timer);
                                if(main.popBox){
                                    main.popBox.close().remove();
                                }

                                vm.knowlegeSelect.timer = setTimeout(function(){
                                    main.popBox = box.popCommon('/html/systemSearch/popKnowledgeSelect.html', {
                                        data: {
                                            ids: $.extend(true, [], vm.points.ids),
                                            box: box
                                        },
                                        id: 'popKnowledgeSelect',
                                        callback: function(res){
                                            /* 获了选中的内容 */
                                            vm.points = res;
                                        }
                                    });

                                    /*引用子弹窗*/
                                    t.curBox.subPopBox = main.popBox;
                                }, 10);
                            },

                            /* 用户选择 */
                            groupSelect: function() {
                                var vm = this,
                                    ids = vm.targetGroup.ids,
                                    groups = vm.targetGroup.fullPaths,
                                    cacheIds = [];

                                for(var i = 0, len = ids.length; i < len; i++){
                                    cacheIds.push({
                                        id: ids[i],
                                        group: groups[i]
                                    });
                                }

                                clearTimeout(vm.groupSelect.timer);
                                if(main.popBox){
                                    main.popBox.close().remove();
                                }

                                vm.groupSelect.timer = setTimeout(function(){
                                    main.popBox = box.popCommon('/html/systemSearch/popGroupSelect.html', {
                                        data: {
                                            popAlert: popAlert,
                                            box: box,
                                            rootPop: t.curBox,
                                            cacheIds: cacheIds
                                        },
                                        id: 'popGroupSelect',
                                        callback: function(res){
                                            /* 获了选中的内容 */
                                            vm.targetGroup = {
                                                fullPaths: res.groups,
                                                ids: res.ids
                                            };
                                        },
                                        cancel: function(){
                                            /* 如果存在子弹窗，则一并关闭 */
                                            if(main.popBox.assignUserBox){
                                                main.popBox.assignUserBox.close().remove();
                                            }

                                            return true;
                                        }
                                    });

                                    /* 引用子弹窗 */
                                    t.curBox.subPopBox = main.popBox;
                                }, 10);
                            },


                            /* 评价标准选择 */
                            appraiseSelect: function() {
                                var vm = this;

                                clearTimeout(vm.appraiseSelect.timer);
                                if(main.popBox){
                                    main.popBox.close().remove();
                                }

                                vm.appraiseSelect.timer = setTimeout(function(){
                                    main.popBox = box.popCommon('/html/systemSearch/popAppraiseSelect.html', {
                                        data: {
                                            popAlert: popAlert,
                                            box: box,
                                            benchId: vm.jobBench.benchId
                                        },
                                        id: 'popAppraiseSelect',
                                        callback: function(res){
                                            var benchItem = res.benchItem;

                                            /* 获了选中的内容 */
                                            vm.jobBench = {
                                                benchName: benchItem.name,
                                                benchId: benchItem.id
                                            };
                                        }
                                    });

                                    /* 引用子弹窗 */
                                    t.curBox.subPopBox = main.popBox;
                                }, 10);
                            },

                            /* 
                             * 下发/暂存
                             * 
                             * @params { Boolean } true: 暂存，其他：下发
                             *
                             **/
                            sub: function (isSave) {
                                var vm = this,
                                    url = vm.isEdit ? t.api.updateJob() : t.api.addJob(),
                                    form = $(vm.$refs.form),
                                    params = {
                                        name: '',
                                        endTime: '',
                                        plIdAndPaths: '',
                                        detail: '',
                                        benchId: vm.jobBench.benchId,
                                        userIds: vm.targetGroup.ids.join(',')
                                    };


                                /* 处理中标志 */
                                if(vm.sub.doing){
                                    return;
                                }
                                vm.sub.doing = true;

                                /* 是否为更新作业 */
                                if(vm.isEdit){
                                    params.id = item.id;
                                }

                                /* 是否暂存 */
                                if(isSave) {
                                    /* 暂存 */
                                    params.isSave = 0;
                                } else {
                                    /* 下达 */
                                    params.isSave = 1;
                                }

                                /* 判断标题是否填写 */
                                if($.trim(vm.jobName) === ''){
                                    vm.sub.doing = false;
                                    popAlert('作业名称不能为空');
                                    return;
                                }
                                params.name = vm.jobName;


                                /* 判断作业标准是否为空 */
                                if($.trim(params.benchId) === ''){
                                    vm.sub.doing = false;
                                    popAlert('作业标准不能为空');
                                    return;
                                }

                                /* 截止时间 */
                                if($.trim(vm.deadline) === ''){
                                    vm.sub.doing = false;
                                    popAlert('截止时间不能为空');
                                    return;
                                }
                                params.endTime = vm.deadline;

                                /* 判断目标学生是否为空 */
                                if($.trim(params.userIds) === ''){
                                    vm.sub.doing = false;
                                    popAlert('目标学生不能为空');
                                    return;
                                }
                               
                                /* 知识点判断 */
                                if(vm.pointIdAndFullpaths === ''){
                                    vm.sub.doing = false;
                                    popAlert('知识点不能为空');
                                    return;
                                }
                                params.plIdAndPaths = vm.pointIdAndFullpaths;

                                /* 判断内容长度 */
                                if(vm.editorInstance){
                                    var txt = vm.editorInstance.getContentTxt();
                                    if(txt.length > 1000){
                                        vm.sub.doing = false;
                                        popAlert('作业评情不能超过1000个字符');
                                        return;
                                    }
                                }

                                /* 内容 */
                                params.detail = vm.content;

                                /* 提交 */
                                form.ajaxSubmit({
                                    url: url,
                                    dataType: 'json',
                                    data: params,

                                    /* 上传进度条 */
                                    // uploadProgress: function(event, position, total, percent) {
                                        // console.log(percent + '%');
                                    // },

                                    success: function(res){
                                        var data = {};

                                        if(res && res.result){
                                            /* 是否保存 */
                                            data.isSave = isSave ? true : false;
                                            data.id = vm.isEdit ? item.id : Number(res.msg);

                                            /* 回调 */
                                            t.curBox.save(data);

                                            vm.closeBox();
                                        } else {
                                            popAlert(res.msg);
                                        }

                                        vm.sub.doing = false;
                                    },

                                    error: function(res){
                                        vm.sub.doing = false;
                                    }
                                });
                            },

                            /* 获取作业详情 */
                            findJobById: function(id, callback) {
                                var vm = this,
                                    url = main.api.findJobById(),
                                    params = {
                                        id: id
                                    };

                                /* 提交 */
                                $.ajax({
                                    type: 'post',
                                    url: url,
                                    dataType: 'json',
                                    data: params,
                                    success: function(res){
                                        var data;

                                        if(res && res.result && res.msg){
                                            if(Object.prototype.toString.call(res.msg) === '[object String]'){
                                                try{
                                                    data = JSON.parse(res.msg);
                                                } catch(e){}
                                            }
                                        } else {
                                            data = {};
                                        }

                                        callback && callback(data);
                                    },
                                    error: function(){
                                    }
                                });
                            }
                        },

                        created: function(){
                            var vm = this;

                            /* 预处理一些信息 */
                            if(vm.isEdit) {
                                vm.jobName = item.name || '';
                                vm.deadline = item.endTime ? item.endTime.split(/\s+/)[0] : '';
                            }
                        }
                    });
                });
            }
        };

        /*初始化入口*/
        main.init();
    });
});
