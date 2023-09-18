# Update version 
The following document explains how to perform a version update in DSP.

When new changes where developed, it is crucial to update the package version.

After the changes: 
* Commit the changes in the repository. 
* Run the `npm version <version>` command, where <version> can be: 
  * patch: in case of little changes 
  * minor: in case of minor changes 
  * major: in case of relevant changes 


* push the update with the `git push --tags` that will create a new tag and update the `master`. 
 