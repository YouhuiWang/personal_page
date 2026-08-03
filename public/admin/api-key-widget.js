/**
 * Sveltia CMS 自定义字段组件 "apikey"
 * - 字段值保持掩码占位符 "********"，绝不把 API key 写进仓库文件
 * - 提供：当前状态 + 新 key 输入 + 管理员密码 + 保存到 Worker
 * - control 必须是 React 组件：使用 CMS 全局暴露的 window.createClass / window.h
 */
(function () {
  var ENDPOINT = 'https://deepseek-chat-proxy.wyh-sz2516001.workers.dev';

  function register() {
    if (!window.CMS || !window.CMS.registerFieldType || !window.createClass) {
      // CMS 尚未就绪，稍后重试
      setTimeout(register, 500);
      return;
    }

    var inputStyle = {
      padding: '0.45rem 0.6rem',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontFamily: 'monospace',
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: '0.4rem',
    };
    var btnStyle = {
      padding: '0.45rem 1rem',
      background: '#1f2937',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    };

    window.CMS.registerFieldType(
      'apikey',
      window.createClass({
        getInitialState: function () {
          return { status: '加载状态…', msg: '', key: '', pw: '', saving: false };
        },

        componentDidMount: function () {
          var self = this;
          fetch(ENDPOINT + '/admin/key-status')
            .then(function (r) {
              return r.ok ? r.json() : Promise.reject();
            })
            .then(function (d) {
              self.setState({
                status: d.configured
                  ? 'API Key 已配置' +
                    (d.updatedAt
                      ? '（更新于 ' + new Date(d.updatedAt).toLocaleString() + '）'
                      : '')
                  : 'API Key 未配置（对话功能暂不可用）',
              });
            })
            .catch(function () {
              self.setState({ status: '无法连接配置服务' });
            });
        },

        save: function () {
          var self = this;
          if (!this.state.key.trim()) {
            this.setState({ msg: '请输入新的 API Key' });
            return;
          }
          if (!this.state.pw) {
            this.setState({ msg: '请输入管理员密码' });
            return;
          }
          this.setState({ msg: '保存中…', saving: true });
          fetch(ENDPOINT + '/admin/key', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-admin-password': this.state.pw,
            },
            body: JSON.stringify({ apiKey: this.state.key.trim() }),
          })
            .then(function (r) {
              return r.json().then(function (d) {
                return { ok: r.ok, d: d };
              });
            })
            .then(function (res) {
              if (res.ok) {
                self.setState({
                  msg: '保存成功 ✓',
                  key: '',
                  pw: '',
                  saving: false,
                  status:
                    'API Key 已配置（更新于 ' +
                    new Date(res.d.updatedAt).toLocaleString() +
                    '）',
                });
              } else {
                var text =
                  res.d.error === 'unauthorized'
                    ? '管理员密码错误'
                    : res.d.error === 'rate limited'
                      ? '操作过于频繁，请稍后再试'
                      : res.d.error === 'admin password not configured'
                        ? '服务端未配置管理员密码'
                        : '保存失败（' + (res.d.error || '未知错误') + '）';
                self.setState({ msg: text, saving: false });
              }
            })
            .catch(function () {
              self.setState({ msg: '网络错误，请重试', saving: false });
            });
        },

        render: function () {
          var self = this;
          var h = window.h;
          return h(
            'div',
            {
              style: {
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.9rem',
              },
            },
            h(
              'div',
              { style: { marginBottom: '0.6rem', fontSize: '0.85rem', color: '#6b7280' } },
              this.state.status,
            ),
            h('input', {
              type: 'password',
              placeholder: '输入新的 API Key',
              style: inputStyle,
              value: this.state.key,
              onChange: function (e) {
                self.setState({ key: e.target.value });
              },
            }),
            h('input', {
              type: 'password',
              placeholder: '管理员密码',
              style: inputStyle,
              value: this.state.pw,
              onChange: function (e) {
                self.setState({ pw: e.target.value });
              },
            }),
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: '0.6rem' } },
              h(
                'button',
                {
                  type: 'button',
                  style: btnStyle,
                  onClick: this.save,
                  disabled: this.state.saving,
                },
                this.state.saving ? '保存中…' : '保存到 Worker',
              ),
              h(
                'span',
                { style: { fontSize: '0.8rem', color: '#6b7280' } },
                this.state.msg,
              ),
            ),
          );
        },
      }),
    );
  }

  register();
})();
