import 'dart:async';

import 'package:build_runner_core/build_runner_core.dart';
import 'package:analyzer/dart/element/element.dart';
import 'package:args/command_runner.dart';
import 'package:build/build.dart';
import 'package:dart2ts/src/utils.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as _P;
import 'package:source_gen/source_gen.dart';
import 'package:yaml/yaml.dart';
import 'dart:io' as io;
import 'package:build_runner_core/src/package_graph/package_graph.dart';
import 'package:dart2ts/src/parts/contexts.dart';
import 'package:build_runner/src/watcher/graph_watcher.dart';
import 'package:build/src/builder/build_step_impl.dart';
import 'package:build/src/builder/build_step.dart';
import 'parts/overrides.dart';
import 'package:build_resolvers/build_resolvers.dart';
import 'package:build_resolvers/src/resolver.dart';
import 'package:glob/glob.dart';
import 'package:build_resolvers/src/build_asset_uri_resolver.dart';
import 'package:build_resolvers/src/analysis_driver.dart';
import 'package:analyzer/src/generated/engine.dart'
    show AnalysisOptionsImpl;

final _P.Context path = new _P.Context(style: _P.Style.posix, current: '/');

/**
 * Second version of the code generator.
 */

Logger _logger = new Logger('dart2ts.lib.code_generator');

class Dart2TsBuildCommand extends Command<bool> {
  @override
  String get description => "Build a file";

  @override
  String get name => 'build';

  Dart2TsBuildCommand() {
    this.argParser
      ..addOption('dir', defaultsTo: '.', abbr: 'd', help: 'the base path of the package to process')
      ..addOption('sdk-prefix', defaultsTo: '@dart2ts/dart', help: 'The absolute module prefix')
      ..addOption('module-prefix', defaultsTo: '@dart2ts.packages', help: 'The absolute module prefix')
      ..addOption('module-suffix', defaultsTo: '', help: 'The modules suffix')
      ..addOption('with-overrides', abbr: 'o', help: 'Overrides file to use')
      ..addFlag('watch', abbr: 'w', defaultsTo: false, help: 'watch for changes');
  }

  @override
  run() async{
    PackageGraph graph = new PackageGraph.fromRoot( new PackageNode("",argResults['dir'],DependencyType.path, null,isRoot:true));
    var resourceManager = ResourceManager();
      // var reader = StubAssetReader();
    var reader =  new FileBasedAssetReader(graph);
    var writer = new FileBasedAssetWriter(graph);
    
    var primary = AssetId(graph.root.name,"lib/dart_ast.dart");
    var buildStep = BuildStepImpl(primary, [], reader, writer, primary.package,
          AnalyzerResolvers(), resourceManager);
    
    var ur = new BuildAssetUriResolver();
    var sdkSummaryPath = "";
    var _driver = analysisDriver(ur,AnalysisOptionsImpl(),sdkSummaryPath);
    var ar = new AnalyzerResolver(_driver,ur);
    var resolver = new PerActionResolver(ar,buildStep, await reader.findAssets(new Glob('lib/**.dart') ).toList()  );
    Overrides overrides;
    if (argResults['with-overrides'] != null) {
      YamlDocument doc = loadYamlDocument(new io.File(argResults['sdk-prefix']).readAsStringSync());
      overrides = new Overrides(doc,resolver);
    } else {
      overrides = null;
    }

    // List<BuildAction> actions = [
      // new BuildAction(
    var builder = new Dart2TsBuilder(new Config(
              modulePrefix: argResults['module-prefix'],
              moduleSuffix: argResults['module-suffix'],
              overrides: overrides,
              sdkPrefix: argResults['sdk-prefix']));
          // graph.root.name,
          // inputs: ['lib/**.dart', 'web/**.dart']
          // )
    // ];

    if (argResults['watch'] == true) {
      final watcher = PackageGraphWatcher(graph);
      watcher.watch(); //actions, packageGraph: graph, onLog: (_) {}, deleteFilesByDefault: true
    } else {
     
      // build(actions, packageGraph: graph, onLog: (_) {}, deleteFilesByDefault: true);
      builder.build(buildStep);
    }
  }
}

// Future<BuildResult> dart2tsBuild(String path, Config config) {
//   PackageGraph graph = new PackageGraph.fromRoot( new PackageNode(path));

//   List<BuildAction> actions = [
//     new BuildAction(new Dart2TsBuilder(config), graph.root.name, inputs: ['lib/**.dart', 'web/**.dart'])
//   ];

//   return build(actions, packageGraph: graph, onLog: (_) {}, deleteFilesByDefault: true);
// }

// Future<ServeHandler> dart2tsWatch(String path, Config config) {
//   PackageGraph graph = new PackageGraph.fromRoot(new PackageNode(path));

//   List<BuildAction> actions = [
//     new BuildAction(new Dart2TsBuilder(config), graph.root.name, inputs: ['lib/**.dart', 'web/**.dart'])
//   ];

//   return watch(actions, packageGraph: graph, onLog: (_) {}, deleteFilesByDefault: true);
// }

Builder dart2TsBuilder([Config config]) {
  return new Dart2TsBuilder(config ?? new Config());
}

/// A [Builder] wrapping on one or more [Generator]s.
abstract class _BaseBuilder extends Builder {
  /// Wrap [_generators] to form a [Builder]-compatible API.
  _BaseBuilder() {}

  @override
  Future build(BuildStep buildStep) async {
    var resolver = buildStep.resolver;
    if (!await resolver.isLibrary(buildStep.inputId)) return;
    var lib = await buildStep.inputLibrary;

    await runWithContext(lib.context, () => generateForLibrary(lib, buildStep));
  }

  Future generateForLibrary(LibraryElement library, BuildStep buildStep);

  @override
  Map<String, List<String>> get buildExtensions => {
        '.dart': ['.ts']
      };
}

class Dart2TsBuilder extends _BaseBuilder {
  Config _config;

  Dart2TsBuilder([this._config]) {
    this._config ??= new Config();
  }

  @override
  Future generateForLibrary(LibraryElement library, BuildStep buildStep) async {
    AssetId destId = new AssetId(buildStep.inputId.package, "${path.withoutExtension(buildStep.inputId.path)}.ts");
    _logger.fine('Processing ${library.location} for ${destId}');

    IndentingPrinter printer = new IndentingPrinter();
    Overrides overrides = await Overrides.forCurrentContext(buildStep.resolver);
    if (_config.overrides != null) {
      overrides.merge(_config.overrides);
    }
    runWithContext(library.context, () {
      LibraryContext libraryContext = new LibraryContext(library, overrides, _config);

      libraryContext
        ..translate()
        ..tsLibrary.writeCode(printer);
    });
    await buildStep.writeAsString(destId, printer.buffer);
  }
}

typedef void PrinterConsumer(IndentingPrinter p);

/**
 * Printer
 */

class IndentingPrinter {
  int defaultIndent;
  StringBuffer _buffer = new StringBuffer();

  int _currentIndent = 0;
  bool _newLine = true;

  IndentingPrinter({this.defaultIndent = 4});

  void write(String some) {
    if (some?.isEmpty ?? true) {
      return;
    }

    if (_newLine) {
      _startLine();
    }

    _buffer.write(some);
  }

  void _startLine() {
    _buffer.write(new String.fromCharCodes(new List.filled(_currentIndent, ' '.codeUnitAt(0))));
    _newLine = false;
  }

  void indent([int count]) => _currentIndent += count ?? defaultIndent;

  void deindent([int count]) => _currentIndent -= count ?? defaultIndent;

  void indented(void consumer(IndentingPrinter), {int count}) {
    indent(count);
    consumer(this);
    deindent(count);
  }

  void writeln([String line = '']) {
    write(line);
    _buffer.writeln();
    _newLine = true;
  }

  void accept(PrinterWriter w) => w == null ? this.write('/* ??? */') : w.writeCode(this);

  void join(Iterable<PrinterWriter> writers, {String delim = ',', bool newLine = false}) {
    joinConsumers(
        writers.map((w) => (p) {
              p.accept(w);
            }),
        delim: delim,
        newLine: newLine);
  }

  void consume(PrinterConsumer c) => c(this);

  void joinConsumers(Iterable<PrinterConsumer> writers, {String delim = ',', bool newLine: false}) {
    bool first = true;
    writers.forEach((w) {
      if (!first) {
        write(delim);
        if (newLine) {
          writeln();
        }
      } else {
        first = false;
      }
      this.consume(w);
    });
  }

  String get buffer => _buffer.toString();
}

abstract class PrinterWriter {
  void writeCode(IndentingPrinter printer);
}
