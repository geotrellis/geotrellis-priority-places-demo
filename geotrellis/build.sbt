import AssemblyKeys._

name := "Priority Places"

scalaVersion := "2.10.3"

resolvers ++=  Seq( 
  "Geotools" at "http://download.osgeo.org/webdav/geotools/",
  "spray repo" at "http://repo.spray.io",
  Resolver.sonatypeRepo("snapshots")
)

libraryDependencies ++= Seq(
  "com.azavea.geotrellis" %% "geotrellis" % "0.9.0-SNAPSHOT",
  "com.azavea.geotrellis" %% "geotrellis-server" % "0.9.0-SNAPSHOT",
  "io.spray" % "spray-routing" % "1.2-RC4",
  "io.spray" % "spray-can" % "1.2-RC4",
  "org.geotools" % "gt-main" % "8.0-M4"
  // "org.geotools" % "gt-coverage" % "8.0-M4",
  // "org.geotools" % "gt-coveragetools" % "8.0-M4"
)



assemblySettings

mergeStrategy in assembly <<= (mergeStrategy in assembly) {
  (old) => {
    case "reference.conf" => MergeStrategy.concat
    case "application.conf" => MergeStrategy.concat
    case "META-INF/MANIFEST.MF" => MergeStrategy.discard
    case "META-INF\\MANIFEST.MF" => MergeStrategy.discard
    case _ => MergeStrategy.first
  }
}

seq(Revolver.settings: _*)
