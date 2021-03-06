import os
import sys
import glob

try:
    import numpy
except ImportError:
    print "You need to have numpy installed on your system to run setup.py. Sorry!"
    sys.exit()

try:
    from Cython.Distutils import build_ext
except ImportError:
    print "You need to have Cython installed on your system to run setup.py. Sorry!"
    sys.exit()

from setuptools import setup, find_packages, Extension

if os.environ.get('USER','') == 'vagrant':
    del os.link

os.chdir(os.path.normpath(os.path.join(os.path.abspath(__file__), os.pardir)))

with open(os.path.join(os.path.dirname(__file__), 'README.md')) as readme:
    README = readme.read()

include_dirs_for_concoct = [numpy.get_include(), '/opt/local/include/']

setup(
    name = "anvio",
    version = open('VERSION').read().strip(),

    scripts = [script for script in glob.glob('bin/*') + glob.glob('sandbox/*') if not script.endswith('-OBSOLETE')],
    include_package_data = True,

    packages = find_packages(),

    install_requires = ['bottle>=0.12.7', 'pysam>=0.8.3', 'hcluster>=0.2.0', 'ete2>=2.2', 'scipy', 'scikit-learn>=0.15', 'django>=1.7', 'cython>=0.21a1', 'h5py>=2.5.0', 'cherrypy>=4.0.0', 'requests>=2.9.1'],

    cmdclass = {'build_ext': build_ext},
    ext_modules = [
                    Extension('anvio.columnprofile', sources = ['./anvio/extensions/columnprofile.c']),
                    Extension("anvio.vbgmm", sources=["./anvio/extensions/concoct/vbgmm.pyx", "./anvio/extensions/concoct/c_vbgmm_fit.c"],
                                libraries =['gsl',  'gslcblas'], include_dirs=include_dirs_for_concoct),
                  ],

    author = "anvi'o Authors",
    author_email = "a.murat.eren@gmail.com",
    description = "An interactive analysis and visualization platform for 'omics data. See https://merenlab.org/projects/anvio for more information",
    license = "GPLv3+",
    keywords = "metagenomics metatranscriptomics microbiology shotgun genomics MBL pipeline sequencing bam visualization SNP",
    url = "https://meren.github.io/projects/anvio/",
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Console',
        'Environment :: Web Environment',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)',
        'Natural Language :: English',
        'Operating System :: MacOS',
        'Operating System :: POSIX',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: JavaScript',
        'Programming Language :: C',
        'Topic :: Scientific/Engineering',
    ],
)
