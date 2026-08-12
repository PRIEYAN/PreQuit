/**
 * React only allows act(...) when the environment opts in. This has to run
 * after the test framework is installed, so it cannot live in setupFiles.
 */
global.IS_REACT_ACT_ENVIRONMENT = true;
