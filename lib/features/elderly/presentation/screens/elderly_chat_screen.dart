import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/services/gemini_service.dart';
import '../../../../core/storage/secure_storage.dart';

class ElderlyChatScreen extends StatefulWidget {
  const ElderlyChatScreen({super.key});

  @override
  State<ElderlyChatScreen> createState() => _ElderlyChatScreenState();
}

class _ElderlyChatScreenState extends State<ElderlyChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  late final GeminiService? _gemini;
  bool _isTyping = false;
  String _userName = 'bạn';

  @override
  void initState() {
    super.initState();
    _gemini = AppConfig.geminiApiKey != 'YOUR_GEMINI_API_KEY'
        ? GeminiService()
        : null;
    _loadUserName();
  }

  Future<void> _loadUserName() async {
    final name = await SecureStorage.getName();
    if (mounted && name != null && name.isNotEmpty) {
      setState(() => _userName = name);
    }
  }

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  List<_ChatMessage> get _messages => _messageList;
  final List<_ChatMessage> _messageList = [];

  String get _welcomeMessage {
    return '$_greeting $_userName! Tôi là trợ lý chăm sóc sức khỏe của bạn. '
        'Hôm nay bạn cảm thấy thế nào? Tôi có thể giúp bạn:\n'
        '• Kiểm tra chỉ số sức khỏe\n'
        '• Nhắc nhở lịch uống thuốc\n'
        '• Trò chuyện cùng bạn';
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isTyping) return;

    setState(() {
      _messageList.add(
          _ChatMessage(text: text, isAi: false, time: _timeNow()));
      _isTyping = true;
    });
    _controller.clear();
    _scrollToBottom();

    String reply;
    final gemini = _gemini;
    if (gemini != null) {
      try {
        reply = await gemini.sendMessage(text);
      } catch (_) {
        reply = 'Xin lỗi $_userName, tôi không thể kết nối lúc này. Vui lòng thử lại.';
      }
    } else {
      await Future.delayed(const Duration(milliseconds: 1000));
      reply = _fakeReply(text);
    }

    if (!mounted) return;
    setState(() {
      _isTyping = false;
      _messageList
          .add(_ChatMessage(text: reply, isAi: true, time: _timeNow()));
    });
    _scrollToBottom();
  }

  String _fakeReply(String question) {
    final q = question.toLowerCase();
    if (q.contains('huyết áp')) {
      return 'Chỉ số huyết áp gần đây của $_userName đang ở mức bình thường. '
          'Hãy tiếp tục duy trì chế độ ăn ít muối và uống đủ nước nhé!';
    }
    if (q.contains('thuốc') || q.contains('uống')) {
      return '$_userName thân mến, hãy kiểm tra mục "Thuốc của tôi" để xem lịch uống thuốc hôm nay. '
          'Đừng quên uống đúng giờ và đủ liều nhé!';
    }
    if (q.contains('đau') || q.contains('mệt') || q.contains('khó chịu')) {
      return '$_userName đang không khỏe à? Hãy nghỉ ngơi và uống đủ nước. '
          'Nếu triệu chứng kéo dài hoặc nghiêm trọng, hãy liên hệ bác sĩ hoặc nhấn nút SOS để thông báo cho gia đình.';
    }
    if (q.contains('chào') || q.contains('xin chào') || q.contains('hello')) {
      return '$_greeting $_userName! Rất vui được trò chuyện với bạn. Tôi có thể giúp gì cho bạn hôm nay?';
    }
    return 'Cảm ơn $_userName đã chia sẻ! Tôi luôn ở đây để hỗ trợ bạn. '
        'Bạn có muốn tôi kiểm tra lịch thuốc hoặc chỉ số sức khỏe hôm nay không?';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _timeNow() {
    final now = DateTime.now();
    return '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Stack(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryLight],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.auto_awesome,
                      color: Colors.white, size: 22),
                ),
                if (_gemini != null)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: AppColors.surface, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('CareNest AI',
                    style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
                Text(
                  _gemini != null ? 'Trực tuyến' : 'Chế độ offline',
                  style: TextStyle(
                    fontSize: 12,
                    color: _gemini != null
                        ? AppColors.success
                        : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: (_messages.isEmpty ? 1 : _messages.length) +
                  (_isTyping ? 1 : 0),
              itemBuilder: (ctx, i) {
                if (_messages.isEmpty) {
                  return _WelcomeBubble(message: _welcomeMessage);
                }
                if (i == _messages.length) return const _TypingIndicator();
                return _BubbleWidget(message: _messages[i]);
              },
            ),
          ),
          _buildQuickReplies(),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildQuickReplies() {
    final replies = [
      'Huyết áp hôm nay?',
      'Thuốc cần uống?',
      'Tôi đau đầu'
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: replies
            .map((r) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: InkWell(
                    onTap: () {
                      _controller.text = r;
                      _sendMessage();
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        border: Border.all(
                            color: AppColors.primary.withOpacity(0.4)),
                        borderRadius: BorderRadius.circular(20),
                        color: AppColors.primary.withOpacity(0.05),
                      ),
                      child: Text(r,
                          style: const TextStyle(
                              color: AppColors.primary, fontSize: 13)),
                    ),
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.background,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.mic_none,
                color: AppColors.textSecondary, size: 22),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _controller,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
              enabled: !_isTyping,
              decoration: InputDecoration(
                hintText: 'Nhập tin nhắn...',
                hintStyle: const TextStyle(color: AppColors.textHint),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppColors.background,
              ),
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: _isTyping ? null : _sendMessage,
            borderRadius: BorderRadius.circular(24),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _isTyping ? AppColors.textHint : AppColors.primary,
                shape: BoxShape.circle,
              ),
              child:
                  const Icon(Icons.send, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isAi;
  final String time;

  _ChatMessage({required this.text, required this.isAi, required this.time});
}

class _WelcomeBubble extends StatelessWidget {
  final String message;
  const _WelcomeBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome,
                color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                  bottomLeft: Radius.circular(4),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Text(
                message,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome,
                color: AppColors.primary, size: 16),
          ),
          const SizedBox(width: 8),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _Dot(delay: 0),
                const SizedBox(width: 4),
                _Dot(delay: 200),
                const SizedBox(width: 4),
                _Dot(delay: 400),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({required this.delay});

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
    _anim = Tween(begin: 0.4, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: AppColors.textHint,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class _BubbleWidget extends StatelessWidget {
  final _ChatMessage message;

  const _BubbleWidget({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            message.isAi ? MainAxisAlignment.start : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (message.isAi) ...[
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome,
                  color: AppColors.primary, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: message.isAi
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: message.isAi
                        ? AppColors.surface
                        : AppColors.primary,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft:
                          Radius.circular(message.isAi ? 4 : 16),
                      bottomRight:
                          Radius.circular(message.isAi ? 16 : 4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    message.text,
                    style: TextStyle(
                      color: message.isAi
                          ? AppColors.textPrimary
                          : Colors.white,
                      fontSize: 14,
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  message.time,
                  style: const TextStyle(
                      color: AppColors.textHint, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
